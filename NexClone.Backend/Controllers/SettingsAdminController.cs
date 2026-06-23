using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace NexClone.Backend.Controllers
{
    public class SettingsAdminController : Controller
    {
        private readonly ApplicationDbContext _context;

        public SettingsAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            ViewData["Title"] = "Global Settings";
            var settings = await _context.AppSettings.ToListAsync();
            
            var toolConfigs = await _context.ToolConfigurations.ToListAsync();
            var defaultTools = new[] { "text-to-voice", "voice-to-text" };
            bool changesMade = false;
            foreach (var defaultTool in defaultTools)
            {
                if (!toolConfigs.Any(t => t.ToolName == defaultTool))
                {
                    var newConfig = new ToolConfiguration { ToolName = defaultTool, ProviderName = "System", ModelName = "Default", IsActive = true, IsMaintenanceMode = false };
                    _context.ToolConfigurations.Add(newConfig);
                    toolConfigs.Add(newConfig);
                    changesMade = true;
                }
            }
            if (changesMade)
            {
                await _context.SaveChangesAsync();
            }

            ViewBag.ToolConfigurations = toolConfigs;
            return View(settings);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SaveSettings(Dictionary<string, string> settings)
        {
            if (settings == null) return RedirectToAction(nameof(Index));

            var existingSettings = await _context.AppSettings.ToListAsync();

            foreach (var kvp in settings)
            {
                var setting = existingSettings.FirstOrDefault(s => s.Key == kvp.Key);
                if (setting != null)
                {
                    if (setting.Value != kvp.Value)
                    {
                        setting.Value = kvp.Value ?? "";
                        setting.UpdatedAt = System.DateTime.UtcNow;
                        _context.Update(setting);
                    }
                }
                else
                {
                    _context.AppSettings.Add(new AppSetting
                    {
                        Key = kvp.Key,
                        Value = kvp.Value ?? "",
                        Description = "Dynamically added setting",
                        UpdatedAt = System.DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SaveToolsMaintenance(Microsoft.AspNetCore.Http.IFormCollection form)
        {
            var toolConfigs = await _context.ToolConfigurations.ToListAsync();
            foreach (var tool in toolConfigs)
            {
                bool isMaintenance = form.ContainsKey($"toolMaintenance_{tool.Id}");
                if (tool.IsMaintenanceMode != isMaintenance)
                {
                    tool.IsMaintenanceMode = isMaintenance;
                    tool.UpdatedAt = System.DateTime.UtcNow;
                    _context.Update(tool);
                }
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
    }
}
