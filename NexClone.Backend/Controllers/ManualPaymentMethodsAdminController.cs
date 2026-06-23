using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System.Linq;
using System.Threading.Tasks;

namespace NexClone.Backend.Controllers
{
    public class ManualPaymentMethodsAdminController : Controller
    {
        private readonly ApplicationDbContext _context;

        public ManualPaymentMethodsAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            ViewData["Title"] = "Manual Payment Methods";
            var methods = await _context.ManualPaymentMethods.OrderByDescending(m => m.CreatedAt).ToListAsync();
            return View(methods);
        }

        public IActionResult Create()
        {
            ViewData["Title"] = "Add Payment Method";
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(ManualPaymentMethod method)
        {
            if (ModelState.IsValid)
            {
                method.CreatedAt = System.DateTime.UtcNow;
                method.UpdatedAt = System.DateTime.UtcNow;
                _context.Add(method);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(method);
        }

        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var method = await _context.ManualPaymentMethods.FindAsync(id);
            if (method == null) return NotFound();

            ViewData["Title"] = $"Edit Payment Method - {method.Name}";
            return View(method);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, ManualPaymentMethod method)
        {
            if (id != method.Id) return NotFound();

            if (ModelState.IsValid)
            {
                try
                {
                    method.UpdatedAt = System.DateTime.UtcNow;
                    _context.Update(method);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!MethodExists(method.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            return View(method);
        }

        [HttpPost]
        public async Task<IActionResult> Delete(int id)
        {
            var method = await _context.ManualPaymentMethods.FindAsync(id);
            if (method != null)
            {
                _context.ManualPaymentMethods.Remove(method);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        private bool MethodExists(int id)
        {
            return _context.ManualPaymentMethods.Any(e => e.Id == id);
        }
    }
}
