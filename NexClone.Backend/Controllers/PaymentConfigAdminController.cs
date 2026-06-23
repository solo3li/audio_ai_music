using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace NexClone.Backend.Controllers
{
    public class PaymentConfigAdminController : Controller
    {
        private readonly ApplicationDbContext _context;

        public PaymentConfigAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            ViewData["Title"] = "Payment Gateways Configuration";
            var configs = await _context.PaymentGatewayConfigs.OrderByDescending(c => c.UpdatedAt).ToListAsync();
            return View(configs);
        }

        public IActionResult Create()
        {
            ViewData["Title"] = "Add Payment Gateway";
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(PaymentGatewayConfig config)
        {
            if (ModelState.IsValid)
            {
                // If setting as active, deactivate other configs of the same provider
                if (config.IsActive)
                {
                    var others = await _context.PaymentGatewayConfigs
                        .Where(c => c.ProviderName == config.ProviderName)
                        .ToListAsync();
                    foreach (var other in others)
                    {
                        other.IsActive = false;
                        _context.Update(other);
                    }
                }

                config.UpdatedAt = DateTime.UtcNow;
                _context.Add(config);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(config);
        }

        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var config = await _context.PaymentGatewayConfigs.FindAsync(id);
            if (config == null) return NotFound();

            ViewData["Title"] = $"Edit Payment Gateway - {config.ProviderName}";
            return View(config);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, PaymentGatewayConfig config)
        {
            if (id != config.Id) return NotFound();

            if (ModelState.IsValid)
            {
                try
                {
                    // If setting as active, deactivate other configs of the same provider
                    if (config.IsActive)
                    {
                        var others = await _context.PaymentGatewayConfigs
                            .Where(c => c.ProviderName == config.ProviderName && c.Id != config.Id)
                            .ToListAsync();
                        foreach (var other in others)
                        {
                            other.IsActive = false;
                            _context.Update(other);
                        }
                    }

                    config.UpdatedAt = DateTime.UtcNow;
                    _context.Update(config);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!PaymentConfigExists(config.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            return View(config);
        }

        [HttpPost]
        public async Task<IActionResult> Delete(int id)
        {
            var config = await _context.PaymentGatewayConfigs.FindAsync(id);
            if (config != null)
            {
                _context.PaymentGatewayConfigs.Remove(config);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        private bool PaymentConfigExists(int id)
        {
            return _context.PaymentGatewayConfigs.Any(e => e.Id == id);
        }
    }
}
