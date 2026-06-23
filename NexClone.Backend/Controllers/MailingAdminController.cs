using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using NexClone.Backend.Services;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace NexClone.Backend.Controllers
{
    public class MailingAdminController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public MailingAdminController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public IActionResult Index()
        {
            ViewData["Title"] = "Mailing & Emails";
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> Settings()
        {
            ViewData["Title"] = "Mailing Settings";
            var config = await _context.ApiConfigurations.FirstOrDefaultAsync(c => c.ProviderName == "Brevo");
            
            var model = new MailingSettingsViewModel();
            if (config != null)
            {
                model.ApiKey = config.ApiKey;
                if (!string.IsNullOrWhiteSpace(config.AdditionalSettings))
                {
                    try
                    {
                        var settings = JsonSerializer.Deserialize<JsonElement>(config.AdditionalSettings);
                        if (settings.TryGetProperty("SenderEmail", out var emailProp)) model.SenderEmail = emailProp.GetString();
                        if (settings.TryGetProperty("SenderName", out var nameProp)) model.SenderName = nameProp.GetString();
                    }
                    catch (JsonException) { }
                }
            }

            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Settings(MailingSettingsViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            var config = await _context.ApiConfigurations.FirstOrDefaultAsync(c => c.ProviderName == "Brevo");
            if (config == null)
            {
                config = new ApiConfiguration
                {
                    Id = Guid.NewGuid(),
                    ProviderName = "Brevo",
                    IsActive = true
                };
                _context.ApiConfigurations.Add(config);
            }

            config.ApiKey = model.ApiKey ?? string.Empty;
            var settingsObj = new
            {
                SenderEmail = model.SenderEmail,
                SenderName = model.SenderName
            };
            config.AdditionalSettings = JsonSerializer.Serialize(settingsObj);
            config.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            
            TempData["SuccessMessage"] = "Mailing settings saved successfully.";
            return RedirectToAction(nameof(Settings));
        }

        [HttpGet]
        public async Task<IActionResult> Templates()
        {
            ViewData["Title"] = "Email Templates";
            var templates = await _context.EmailTemplates.OrderByDescending(t => t.UpdatedAt).ToListAsync();
            return View(templates);
        }

        [HttpGet]
        public IActionResult CreateTemplate()
        {
            ViewData["Title"] = "Create Email Template";
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateTemplate(EmailTemplate template)
        {
            if (ModelState.IsValid)
            {
                template.Id = Guid.NewGuid();
                template.CreatedAt = DateTime.UtcNow;
                template.UpdatedAt = DateTime.UtcNow;
                _context.EmailTemplates.Add(template);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Templates));
            }
            return View(template);
        }

        [HttpGet]
        public async Task<IActionResult> EditTemplate(Guid? id)
        {
            if (id == null) return NotFound();
            var template = await _context.EmailTemplates.FindAsync(id);
            if (template == null) return NotFound();
            
            ViewData["Title"] = $"Edit Template: {template.Name}";
            return View(template);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditTemplate(Guid id, EmailTemplate template)
        {
            if (id != template.Id) return NotFound();

            if (ModelState.IsValid)
            {
                try
                {
                    template.UpdatedAt = DateTime.UtcNow;
                    _context.Update(template);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!_context.EmailTemplates.Any(e => e.Id == id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Templates));
            }
            return View(template);
        }

        [HttpPost]
        public async Task<IActionResult> DeleteTemplate(Guid id)
        {
            var template = await _context.EmailTemplates.FindAsync(id);
            if (template != null)
            {
                _context.EmailTemplates.Remove(template);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Templates));
        }

        [HttpGet]
        public async Task<IActionResult> SendMail()
        {
            ViewData["Title"] = "Send Broadcast / Email";
            ViewBag.Templates = await _context.EmailTemplates.OrderBy(t => t.Name).ToListAsync();
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SendMail(SendMailViewModel model)
        {
            ViewBag.Templates = await _context.EmailTemplates.OrderBy(t => t.Name).ToListAsync();
            if (!ModelState.IsValid) return View(model);

            string subject = model.Subject;
            string htmlBody = model.HtmlBody;

            if (model.TemplateId.HasValue)
            {
                var template = await _context.EmailTemplates.FindAsync(model.TemplateId);
                if (template != null)
                {
                    subject = template.Subject;
                    htmlBody = template.HtmlBody;
                }
            }

            if (string.IsNullOrWhiteSpace(subject) || string.IsNullOrWhiteSpace(htmlBody))
            {
                ModelState.AddModelError(string.Empty, "Subject and Body are required.");
                return View(model);
            }

            if (string.IsNullOrWhiteSpace(model.TargetUserEmail))
            {
                // Send to ALL users
                // In a production environment, this should be an async background job.
                // We will fire and forget a task for demonstration/simplicity without blocking the thread for too long.
                var users = await _context.Users.Select(u => new { u.Email, u.FullName }).ToListAsync();
                
                // Fire and forget
                _ = Task.Run(async () =>
                {
                    foreach (var u in users)
                    {
                        if (!string.IsNullOrWhiteSpace(u.Email))
                        {
                            await _emailService.SendEmailAsync(u.Email, u.FullName ?? "User", subject, htmlBody);
                        }
                    }
                });

                TempData["SuccessMessage"] = $"Started sending email to {users.Count} users in the background.";
            }
            else
            {
                // Send to specific user
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.TargetUserEmail);
                string toName = user?.FullName ?? "User";
                
                var success = await _emailService.SendEmailAsync(model.TargetUserEmail, toName, subject, htmlBody);
                if (success)
                {
                    TempData["SuccessMessage"] = $"Email sent successfully to {model.TargetUserEmail}.";
                }
                else
                {
                    TempData["ErrorMessage"] = $"Failed to send email to {model.TargetUserEmail}. Check logs for details.";
                }
            }

            return RedirectToAction(nameof(SendMail));
        }
    }

    public class MailingSettingsViewModel
    {
        public string? ApiKey { get; set; }
        public string? SenderEmail { get; set; }
        public string? SenderName { get; set; }
    }

    public class SendMailViewModel
    {
        public string? TargetUserEmail { get; set; } // If empty, sends to ALL
        public Guid? TemplateId { get; set; }
        public string? Subject { get; set; }
        public string? HtmlBody { get; set; }
    }
}
