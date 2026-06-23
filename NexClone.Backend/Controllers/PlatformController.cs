using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Claims;

namespace NexClone.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlatformController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly NexClone.Backend.Services.IMediaService _mediaService;

        public PlatformController(ApplicationDbContext context, NexClone.Backend.Services.IMediaService mediaService)
        {
            _context = context;
            _mediaService = mediaService;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var userCount = await _context.Users.CountAsync();
            var subCount = await _context.Subscriptions.CountAsync();

            return Ok(new
            {
                TotalUsers = userCount,
                ActiveSubscriptions = subCount,
                PlatformStatus = "Online",
                Version = "1.0.0"
            });
        }

        [HttpGet("plans")]
        public async Task<IActionResult> GetPlans()
        {
            var plans = await _context.Plans.OrderBy(p => p.PriceUsd).ToListAsync();
            return Ok(plans);
        }

        [HttpGet("voices")]
        public async Task<IActionResult> GetVoices()
        {
            var voices = await _context.Voices
                .Where(v => v.IsActive)
                .OrderBy(v => v.Order)
                .ToListAsync();

            var mappedVoices = new List<object>();
            foreach(var v in voices)
            {
                string demoUrl = null;
                if (!string.IsNullOrWhiteSpace(v.DemoAudio))
                {
                    demoUrl = await _mediaService.GetFileUrlAsync(v.DemoAudio);
                }
                mappedVoices.Add(new {
                    v.Id,
                    v.Name,
                    v.VoiceName,
                    v.Accent,
                    v.Gender,
                    v.IsPremium,
                    DemoAudio = demoUrl
                });
            }
                
            return Ok(mappedVoices);
        }

        [HttpGet("dialects")]
        public async Task<IActionResult> GetDialects()
        {
            var dialects = await _context.Dialects
                .Where(d => d.IsActive)
                .OrderBy(d => d.Order)
                .Select(d => new { d.Id, d.Name, d.Value, d.IsPremium })
                .ToListAsync();
            return Ok(dialects);
        }

        [HttpGet("emotions")]
        public async Task<IActionResult> GetEmotions()
        {
            var emotions = await _context.Emotions
                .Where(e => e.IsActive)
                .OrderBy(e => e.Order)
                .Select(e => new { e.Id, e.Name, e.Value, e.IsPremium })
                .ToListAsync();
            return Ok(emotions);
        }

        [HttpGet("styles")]
        public async Task<IActionResult> GetStyles()
        {
            var styles = await _context.Styles
                .Where(s => s.IsActive)
                .OrderBy(s => s.Order)
                .Select(s => new { s.Id, s.Name, s.Value, s.IsPremium })
                .ToListAsync();
            return Ok(styles);
        }

        [HttpGet("tts-config")]
        public async Task<IActionResult> GetTtsConfig()
        {
            int maxChars = 150; // Default
            bool customInstructionsEnabled = false;

            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                var userIdStr = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (Guid.TryParse(userIdStr, out var userId))
                {
                    var user = await _context.Users.FindAsync(userId);
                    if (user != null && user.IsStaff)
                    {
                        // Staff gets maximum features by default or we can check the db
                        maxChars = 10000;
                        customInstructionsEnabled = true;
                    }

                    var activeSubscription = await _context.Subscriptions
                        .Include(s => s.Plan)
                        .Where(s => s.UserId == userId && s.Status.ToLower() == "active" && s.EndDate > DateTime.UtcNow)
                        .OrderByDescending(s => s.EndDate)
                        .FirstOrDefaultAsync();

                    if (activeSubscription?.Plan != null)
                    {
                        // If they have a plan, it overrides defaults, even for staff (so staff can test limits)
                        maxChars = activeSubscription.Plan.TtsMaxCharsPerRequest;
                        customInstructionsEnabled = activeSubscription.Plan.TtsCustomInstructionsEnabled;
                    }
                }
            }

            var activeToolConfig = await _context.ToolConfigurations
                .FirstOrDefaultAsync(c => c.ToolName == "text-to-voice" && c.IsActive);

            bool isMaintenanceMode = activeToolConfig?.IsMaintenanceMode ?? false;

            return Ok(new { maxChars = maxChars, customInstructionsEnabled = customInstructionsEnabled, isMaintenanceMode = isMaintenanceMode });
        }

        [HttpGet("vtt-config")]
        public async Task<IActionResult> GetVttConfig()
        {
            var activeToolConfig = await _context.ToolConfigurations
                .FirstOrDefaultAsync(c => c.ToolName == "voice-to-text" && c.IsActive);

            bool isMaintenanceMode = activeToolConfig?.IsMaintenanceMode ?? false;

            return Ok(new { isMaintenanceMode = isMaintenanceMode });
        }
    }
}
