using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using NexClone.Backend.Models;
using NexClone.Backend.Services;
using System.Security.Claims;
using System.Threading.Tasks;
using System;

namespace NexClone.Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMediaService _mediaService;
        private readonly ApplicationDbContext _dbContext;

        public ProfileController(UserManager<ApplicationUser> userManager, IMediaService mediaService, ApplicationDbContext dbContext)
        {
            _userManager = userManager;
            _mediaService = mediaService;
            _dbContext = dbContext;
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound("User not found.");

            if (!string.IsNullOrWhiteSpace(request.FullName))
            {
                user.FullName = request.FullName;
            }

            if (request.ProfileImage != null)
            {
                var fileId = Guid.NewGuid().ToString();
                var url = await _mediaService.UploadFileAsync(request.ProfileImage.OpenReadStream(), request.ProfileImage.FileName, request.ProfileImage.ContentType, "profile");
                user.ImageUrl = url;
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { Errors = result.Errors });
            }

            string? presignedUrl = null;
            if (!string.IsNullOrEmpty(user.ImageUrl))
            {
                if (user.ImageUrl.StartsWith("http"))
                {
                    presignedUrl = user.ImageUrl;
                }
                else
                {
                    presignedUrl = await _mediaService.GetFileUrlAsync(user.ImageUrl, "profile");
                }
            }

            return Ok(new { Message = "Profile updated successfully", ImageUrl = presignedUrl, FullName = user.FullName });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound("User not found.");

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(new { Errors = result.Errors });
            }

            return Ok(new { Message = "Password changed successfully" });
        }
    }

    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public IFormFile? ProfileImage { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
