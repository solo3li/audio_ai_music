using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System.Linq;
using System.Threading.Tasks;

namespace NexClone.Backend.Controllers
{
    public class HistoryAdminController : Controller
    {
        private readonly ApplicationDbContext _context;

        public HistoryAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index(string searchEmail)
        {
            var query = _context.GenerationHistories
                .Include(h => h.User)
                .AsQueryable();

            if (!string.IsNullOrEmpty(searchEmail))
            {
                query = query.Where(h => h.User.Email.ToLower().Contains(searchEmail.ToLower()));
            }

            var history = await query
                .OrderByDescending(h => h.CreatedAt)
                .Take(500)
                .ToListAsync();

            ViewBag.CurrentSearch = searchEmail;
            return View(history);
        }

        public async Task<IActionResult> Details(Guid id, [FromServices] NexClone.Backend.Services.IMediaService mediaService)
        {
            var history = await _context.GenerationHistories
                .Include(h => h.User)
                .FirstOrDefaultAsync(h => h.Id == id);

            if (history == null) return NotFound();

            if (!string.IsNullOrEmpty(history.FileUrl) && !history.FileUrl.StartsWith("http"))
            {
                history.FileUrl = await mediaService.GetFileUrlAsync(history.FileUrl, history.Type);
            }

            return View(history);
        }
    }
}
