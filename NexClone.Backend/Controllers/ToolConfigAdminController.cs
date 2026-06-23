using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace NexClone.Backend.Controllers
{
    public class ToolConfigAdminController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ToolConfigAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            ViewData["Title"] = "Tool Configurations";
            var configs = await _context.ToolConfigurations.OrderByDescending(c => c.UpdatedAt).ToListAsync();
            return View(configs);
        }

        public async Task<IActionResult> Create()
        {
            ViewData["Title"] = "Add Tool Configuration";
            var toolNames = new List<string> { "text-to-voice", "voice-to-text" };
            ViewBag.Tools = new SelectList(toolNames);
            ViewBag.Plans = await _context.Plans.ToListAsync();
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(ToolConfiguration config, Microsoft.AspNetCore.Http.IFormCollection form)
        {
            if (ModelState.IsValid)
            {
                config.Id = Guid.NewGuid();
                config.UpdatedAt = DateTime.UtcNow;
                _context.Add(config);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            var toolNames = new List<string> { "text-to-voice", "voice-to-text" };
            ViewBag.Tools = new SelectList(toolNames, config.ToolName);
            ViewBag.Plans = await _context.Plans.ToListAsync();
            return View(config);
        }

        public async Task<IActionResult> Edit(Guid? id)
        {
            if (id == null) return NotFound();

            var config = await _context.ToolConfigurations.FindAsync(id);
            if (config == null) return NotFound();

            ViewData["Title"] = $"Edit Tool Configuration - {config.ToolName}";
            var toolNames = new List<string> { "text-to-voice", "voice-to-text" };
            ViewBag.Tools = new SelectList(toolNames, config.ToolName);
            ViewBag.Plans = await _context.Plans.ToListAsync();
            return View(config);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(Guid id, ToolConfiguration config, Microsoft.AspNetCore.Http.IFormCollection form)
        {
            if (id != config.Id) return NotFound();

            if (ModelState.IsValid)
            {
                try
                {
                    config.UpdatedAt = DateTime.UtcNow;
                    _context.Update(config);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!ToolConfigurationExists(config.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            var toolNames = new List<string> { "text-to-voice", "voice-to-text" };
            ViewBag.Tools = new SelectList(toolNames, config.ToolName);
            ViewBag.Plans = await _context.Plans.ToListAsync();
            return View(config);
        }

        [HttpPost]
        public async Task<IActionResult> Delete(Guid id)
        {
            var config = await _context.ToolConfigurations.FindAsync(id);
            if (config != null)
            {
                _context.ToolConfigurations.Remove(config);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        private bool ToolConfigurationExists(Guid id)
        {
            return _context.ToolConfigurations.Any(e => e.Id == id);
        }
    }
}
