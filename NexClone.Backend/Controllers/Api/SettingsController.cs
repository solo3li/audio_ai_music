using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System.Linq;
using System.Threading.Tasks;

namespace NexClone.Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("public")]
        public async Task<IActionResult> GetPublicSettings()
        {
            var settings = await _context.AppSettings.ToListAsync();
            
            var maintenanceModeStr = settings.FirstOrDefault(s => s.Key == "Site.MaintenanceMode")?.Value ?? "false";
            bool isMaintenanceMode = bool.TryParse(maintenanceModeStr, out var m) && m;
            
            var maintenanceEndDate = settings.FirstOrDefault(s => s.Key == "Site.MaintenanceEndDate")?.Value;

            var googleClientId = settings.FirstOrDefault(s => s.Key == "OAuth.GoogleClientId")?.Value;

            return Ok(new
            {
                isMaintenanceMode,
                maintenanceEndDate,
                googleClientId = string.IsNullOrWhiteSpace(googleClientId) ? null : googleClientId
            });
        }
    }
}
