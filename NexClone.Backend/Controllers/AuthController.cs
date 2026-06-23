using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NexClone.Backend.Models;
using NexClone.Backend.Services;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace NexClone.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;
        private readonly IMediaService _mediaService;
        private readonly IEmailService _emailService;

        public AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration, ApplicationDbContext context, IMediaService mediaService, IEmailService emailService)
        {
            _userManager = userManager;
            _configuration = configuration;
            _context = context;
            _mediaService = mediaService;
            _emailService = emailService;
        }

        private static readonly HttpClient _httpClient = new HttpClient();

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // 1. Check for disposable email
            var domain = request.Email.Split('@').LastOrDefault()?.ToLower();
            if (!string.IsNullOrEmpty(domain))
            {
                try
                {
                    var response = await _httpClient.GetAsync($"https://open.kickbox.com/v1/disposable/{domain}");
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        using var doc = System.Text.Json.JsonDocument.Parse(content);
                        if (doc.RootElement.TryGetProperty("disposable", out var isDisposableElement) && isDisposableElement.GetBoolean())
                        {
                            return BadRequest(new { Errors = new[] { "عفواً، لا يمكن التسجيل باستخدام بريد إلكتروني مؤقت (Disposable Email)." } });
                        }
                    }
                }
                catch
                {
                    // Ignore errors so registration isn't blocked if API is down
                }
            }

            var ipAddress = Request.Headers["X-Forwarded-For"].FirstOrDefault() ?? HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var userAgent = Request.Headers["User-Agent"].ToString() ?? "Unknown";
            var fingerprint = request.DeviceFingerprint ?? string.Empty;

            // Check if this fingerprint or IP has ever registered an account
            bool hasClaimedFreeTrial = false;
            
            if (!string.IsNullOrEmpty(fingerprint))
            {
                hasClaimedFreeTrial = await _context.DeviceFingerprints.AnyAsync(df => df.FingerprintHash == fingerprint);
            }
            
            if (!hasClaimedFreeTrial)
            {
                hasClaimedFreeTrial = await _context.DeviceFingerprints.AnyAsync(df => df.IpAddress == ipAddress);
            }

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.FullName,
                Country = request.Country,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                var errors = new List<string>();
                foreach (var error in result.Errors)
                    errors.Add(error.Description);
                return BadRequest(new { Errors = errors });
            }

            // Log fingerprint
            _context.DeviceFingerprints.Add(new DeviceFingerprint
            {
                UserId = user.Id,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                FingerprintHash = fingerprint
            });

            if (!hasClaimedFreeTrial)
            {
                var freeTrialPlan = await _context.Plans.FirstOrDefaultAsync(p => p.IsFreeTrial);

                if (freeTrialPlan != null)
                {
                    user.AvailableCredits = freeTrialPlan.MonthlyCredits;
                    _context.Subscriptions.Add(new Subscription
                    {
                        UserId = user.Id,
                        PlanId = freeTrialPlan.Id,
                        StartDate = DateTime.UtcNow,
                        EndDate = DateTime.UtcNow.AddDays(freeTrialPlan.DurationDays),
                        Status = "Active"
                    });
                }
            }
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            SetTokenCookie(token);

            return Ok(new AuthResponse
            {
                Email = user.Email,
                IsVerified = user.IsVerified
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
                return Unauthorized(new { Message = "Invalid email or password." });

            var ipAddress = Request.Headers["X-Forwarded-For"].FirstOrDefault() ?? HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var userAgent = Request.Headers["User-Agent"].ToString() ?? "Unknown";
            var fingerprint = request.DeviceFingerprint ?? string.Empty;

            _context.DeviceFingerprints.Add(new DeviceFingerprint
            {
                UserId = user.Id,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                FingerprintHash = fingerprint
            });
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            SetTokenCookie(token);

            return Ok(new AuthResponse
            {
                Email = user.Email!,
                IsVerified = user.IsVerified
            });
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var googleClientId = await _context.AppSettings
                .Where(s => s.Key == "OAuth.GoogleClientId")
                .Select(s => s.Value)
                .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(googleClientId))
            {
                return BadRequest(new { Message = "Google Login is not configured on this server." });
            }

            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(request.Token, new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { googleClientId }
                });
            }
            catch (InvalidJwtException)
            {
                return Unauthorized(new { Message = "Invalid Google Token." });
            }

            var user = await _userManager.FindByEmailAsync(payload.Email);
            var isNewUser = false;

            if (user == null)
            {
                isNewUser = true;
                user = new ApplicationUser
                {
                    UserName = payload.Email,
                    Email = payload.Email,
                    FullName = payload.Name ?? "Google User",
                    Country = "Unknown",
                    CreatedAt = DateTime.UtcNow,
                    IsVerified = payload.EmailVerified
                };

                // Create user with a strong random password
                var result = await _userManager.CreateAsync(user, Guid.NewGuid().ToString() + "A!1a");
                
                if (!result.Succeeded)
                {
                    return BadRequest(new { Message = "Could not create user account." });
                }
            }

            var ipAddress = Request.Headers["X-Forwarded-For"].FirstOrDefault() ?? HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var userAgent = Request.Headers["User-Agent"].ToString() ?? "Unknown";
            var fingerprint = request.DeviceFingerprint ?? string.Empty;

            // Check trial eligibility if new user
            if (isNewUser)
            {
                bool hasClaimedFreeTrial = false;
                
                if (!string.IsNullOrEmpty(fingerprint))
                {
                    hasClaimedFreeTrial = await _context.DeviceFingerprints.AnyAsync(df => df.FingerprintHash == fingerprint);
                }
                
                if (!hasClaimedFreeTrial)
                {
                    hasClaimedFreeTrial = await _context.DeviceFingerprints.AnyAsync(df => df.IpAddress == ipAddress);
                }

                if (!hasClaimedFreeTrial)
                {
                    var freeTrialPlan = await _context.Plans.FirstOrDefaultAsync(p => p.IsFreeTrial);

                    if (freeTrialPlan != null)
                    {
                        user.AvailableCredits = freeTrialPlan.MonthlyCredits;
                        _context.Subscriptions.Add(new Subscription
                        {
                            UserId = user.Id,
                            PlanId = freeTrialPlan.Id,
                            StartDate = DateTime.UtcNow,
                            EndDate = DateTime.UtcNow.AddDays(freeTrialPlan.DurationDays),
                            Status = "Active"
                        });
                    }
                }
            }

            _context.DeviceFingerprints.Add(new DeviceFingerprint
            {
                UserId = user.Id,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                FingerprintHash = fingerprint
            });
            
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            SetTokenCookie(token);

            return Ok(new AuthResponse
            {
                Email = user.Email!,
                IsVerified = user.IsVerified
            });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                // Return success even if not found to prevent email enumeration attacks
                return Ok(new { Message = "If an account with this email exists, a password reset link has been sent." });
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            
            var origin = Request.Headers["Origin"].FirstOrDefault() ?? "http://178.62.192.74:3000";
            var resetLink = $"{origin}/reset-password?email={Uri.EscapeDataString(request.Email)}&token={Uri.EscapeDataString(token)}";

            string emailHtml = $@"
<div style='font-family: Arial, sans-serif; background-color: #0a0015; color: #ffffff; padding: 40px; text-align: center; border-radius: 8px;'>
    <h2 style='color: #8b5cf6;'>إعادة تعيين كلمة المرور</h2>
    <p style='color: #d1d5db; font-size: 16px; margin-bottom: 30px;'>لقد طلبت إعادة تعيين كلمة المرور الخاصة بحسابك في NexMedia. اضغط على الزر أدناه لاختيار كلمة مرور جديدة.</p>
    <a href='{resetLink}' style='background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 15px 30px; font-size: 16px; font-weight: bold; border-radius: 50px; display: inline-block;'>إعادة تعيين كلمة المرور</a>
    <p style='color: #9ca3af; font-size: 14px; margin-top: 30px;'>إذا لم تقم بطلب ذلك، يمكنك تجاهل هذه الرسالة.</p>
</div>
            ";

            await _emailService.SendEmailAsync(user.Email, user.FullName ?? user.UserName ?? "User", "إعادة تعيين كلمة المرور - NexMedia", emailHtml);

            return Ok(new { Message = "If an account with this email exists, a password reset link has been sent." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return BadRequest(new { Message = "Invalid request." });
            }

            var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);

            if (result.Succeeded)
            {
                return Ok(new { Message = "Password has been reset successfully." });
            }

            var errors = new List<string>();
            foreach (var error in result.Errors)
            {
                errors.Add(error.Description);
            }

            return BadRequest(new { Errors = errors });
        }

        private string GenerateJwtToken(ApplicationUser user)
        {
            var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not found");
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private void SetTokenCookie(string token)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            Response.Cookies.Append("jwt", token, cookieOptions);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("jwt", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None
            });
            return Ok(new { Message = "Logged out" });
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            if (!User.Identity?.IsAuthenticated ?? true)
                return Unauthorized();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return Unauthorized();

            var activeSub = await _context.Subscriptions
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.UserId == user.Id && s.Status == "Active" && s.EndDate > DateTime.UtcNow);

            string? imageUrl = null;
            if (!string.IsNullOrEmpty(user.ImageUrl))
            {
                if (user.ImageUrl.StartsWith("http"))
                {
                    imageUrl = user.ImageUrl;
                }
                else
                {
                    imageUrl = await _mediaService.GetFileUrlAsync(user.ImageUrl, "profile");
                }
            }

            return Ok(new
            {
                Email = user.Email,
                FullName = user.FullName,
                Country = user.Country,
                ImageUrl = imageUrl,
                IsVerified = user.IsVerified,
                AvailableCredits = user.AvailableCredits,
                IsStaff = user.IsStaff,
                ActivePlan = activeSub != null ? new {
                    Name = activeSub.Plan.Name,
                    NameAr = activeSub.Plan.NameAr,
                    Status = activeSub.Status,
                    EndDate = activeSub.EndDate,
                    TtsCustomInstructionsEnabled = activeSub.Plan.TtsCustomInstructionsEnabled
                } : null
            });
        }
    }
}
