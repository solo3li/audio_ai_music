using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;

namespace NexClone.Backend.Controllers
{
    public class VoicesController : Controller
    {
        private readonly ApplicationDbContext _context;

        public VoicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var voices = await _context.Voices.OrderBy(v => v.Id).ToListAsync();
            return View(voices);
        }

        [HttpPost]
        public async Task<IActionResult> Delete(long id)
        {
            var voice = await _context.Voices.FindAsync(id);
            if (voice != null)
            {
                _context.Voices.Remove(voice);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }
    }
}
