using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System;
using System.Threading.Tasks;

namespace NexClone.Backend.Controllers
{
    public class ApiConfigAdminController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ApiConfigAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            ViewData["Title"] = "API Keys Management";
            var configs = await _context.ApiConfigurations.OrderByDescending(c => c.UpdatedAt).ToListAsync();
            return View(configs);
        }

        public IActionResult Create()
        {
            ViewData["Title"] = "Add API Key";
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(ApiConfiguration config)
        {
            if (ModelState.IsValid)
            {
                config.Id = Guid.NewGuid();
                config.UpdatedAt = DateTime.UtcNow;
                _context.Add(config);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(config);
        }

        public async Task<IActionResult> Edit(Guid? id)
        {
            if (id == null) return NotFound();

            var config = await _context.ApiConfigurations.FindAsync(id);
            if (config == null) return NotFound();

            ViewData["Title"] = $"Edit API Key - {config.ProviderName}";
            return View(config);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(Guid id, ApiConfiguration config)
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
                    if (!ApiConfigurationExists(config.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            return View(config);
        }

        [HttpPost]
        public async Task<IActionResult> Delete(Guid id)
        {
            var config = await _context.ApiConfigurations.FindAsync(id);
            if (config != null)
            {
                _context.ApiConfigurations.Remove(config);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        private bool ApiConfigurationExists(Guid id)
        {
            return _context.ApiConfigurations.Any(e => e.Id == id);
        }
    }
}
