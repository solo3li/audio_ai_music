using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System.ComponentModel.DataAnnotations;

namespace NexClone.Backend.Controllers.Api
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ManualPaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public ManualPaymentsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _context = context;
            _userManager = userManager;
            _configuration = configuration;
        }

        [HttpGet("methods")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMethods()
        {
            var methods = await _context.ManualPaymentMethods
                .Where(m => m.IsActive)
                .Select(m => new { m.Id, m.Name, m.AccountDetails, m.Instructions })
                .ToListAsync();
            
            return Ok(methods);
        }

        public class ManualPaymentRequestDto
        {
            [Required]
            public int PlanId { get; set; }
            [Required]
            public IFormFile ReceiptImage { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> CreateManualPayment([FromForm] ManualPaymentRequestDto request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var plan = await _context.Plans.FindAsync(request.PlanId);
            if (plan == null) return NotFound(new { message = "Plan not found" });

            // Upload image logic. For now, we will store it locally or use MinIO if available
            // Let's assume we save it to wwwroot/receipts
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "receipts");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + "_" + request.ReceiptImage.FileName;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await request.ReceiptImage.CopyToAsync(fileStream);
            }

            var receiptUrl = $"/receipts/{uniqueFileName}";

            var payment = new Payment
            {
                PaymentId = "MANUAL_" + Guid.NewGuid().ToString("N").Substring(0, 10),
                Amount = plan.PriceUsd > 0 ? plan.PriceUsd : plan.PriceEgp, // We'll just store whatever is >0 or handle currency properly
                Currency = plan.PriceUsd > 0 ? "USD" : "EGP", // Simplistic handling
                Method = "Manual",
                Status = "Pending",
                ReceiptUrl = receiptUrl,
                PlanId = plan.Id,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment submitted successfully. Waiting for admin approval." });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingPayments()
        {
            var pending = await _context.Payments
                .Include(p => p.User)
                .Include(p => p.Plan)
                .Where(p => p.Method == "Manual" && p.Status == "Pending")
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.Amount,
                    p.Currency,
                    p.ReceiptUrl,
                    p.CreatedAt,
                    UserEmail = p.User.Email,
                    PlanName = p.Plan.Name
                })
                .ToListAsync();

            return Ok(pending);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApprovePayment(int id)
        {
            var payment = await _context.Payments.Include(p => p.Plan).FirstOrDefaultAsync(p => p.Id == id);
            if (payment == null) return NotFound();
            if (payment.Status != "Pending") return BadRequest(new { message = "Payment is not pending" });

            payment.Status = "Approved";
            payment.UpdatedAt = DateTime.UtcNow;

            // Create/Renew Subscription
            var existingSub = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.UserId == payment.UserId && s.PlanId == payment.PlanId);

            if (existingSub != null)
            {
                existingSub.EndDate = (existingSub.EndDate > DateTime.UtcNow ? existingSub.EndDate : DateTime.UtcNow).AddDays(payment.Plan.DurationDays);
                existingSub.Status = "Active";
                payment.SubscriptionId = existingSub.Id;
            }
            else
            {
                var newSub = new Subscription
                {
                    UserId = payment.UserId,
                    PlanId = payment.Plan.Id,
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddDays(payment.Plan.DurationDays),
                    Status = "Active"
                };
                _context.Subscriptions.Add(newSub);
                await _context.SaveChangesAsync();
                payment.SubscriptionId = newSub.Id;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Payment approved" });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectPayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null) return NotFound();
            if (payment.Status != "Pending") return BadRequest(new { message = "Payment is not pending" });

            payment.Status = "Rejected";
            payment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Payment rejected" });
        }
    }
}
