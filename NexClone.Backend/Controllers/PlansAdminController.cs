using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System.Linq;
using System.Threading.Tasks;

namespace NexClone.Backend.Controllers
{
    public class PlansAdminController : Controller
    {
        private readonly ApplicationDbContext _context;

        public PlansAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            ViewData["Title"] = "Subscription Plans Management";
            var plans = await _context.Plans.OrderBy(p => p.Id).ToListAsync();
            return View(plans);
        }

        public IActionResult Create()
        {
            ViewData["Title"] = "Create Plan";
            return View(new Plan());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Plan plan)
        {
            // Set defaults for missing fields from the form
            if (string.IsNullOrEmpty(plan.NameAr)) plan.NameAr = plan.Name;
            
            _context.Add(plan);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var plan = await _context.Plans.FindAsync(id);
            if (plan == null) return NotFound();

            ViewData["Title"] = $"Edit Plan - {plan.Name}";
            return View(plan);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Plan plan)
        {
            if (id != plan.Id) return NotFound();

            // We do not check ModelState.IsValid here for the entire object because we know some properties (like NameAr, Description) 
            // are missing from the Edit form and will fail validation.
            // We just fetch the existing and update.
            var existingPlan = await _context.Plans.FindAsync(id);
            if (existingPlan == null) return NotFound();

            try
            {
                existingPlan.Name = plan.Name;
                existingPlan.DurationDays = plan.DurationDays;
                existingPlan.GracePeriodDays = plan.GracePeriodDays;
                existingPlan.PriceUsd = plan.PriceUsd;
                existingPlan.PriceEgp = plan.PriceEgp;
                existingPlan.MonthlyCredits = plan.MonthlyCredits;

                existingPlan.TtsEnabled = plan.TtsEnabled;
                existingPlan.TtsMaxCharsPerRequest = plan.TtsMaxCharsPerRequest;
                existingPlan.TtsCharactersBlock = plan.TtsCharactersBlock;
                existingPlan.TtsCostPerChar = plan.TtsCostPerChar;
                existingPlan.TtsCustomInstructionsEnabled = plan.TtsCustomInstructionsEnabled;

                existingPlan.SttEnabled = plan.SttEnabled;
                existingPlan.SttMaxFileSizeMb = plan.SttMaxFileSizeMb;
                existingPlan.SttCostPerMinute = plan.SttCostPerMinute;

                existingPlan.IsFreeTrial = plan.IsFreeTrial;

                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PlanExists(plan.Id)) return NotFound();
                else throw;
            }
        }

        [HttpPost]
        public async Task<IActionResult> Delete(int id)
        {
            var plan = await _context.Plans.FindAsync(id);
            if (plan != null)
            {
                _context.Plans.Remove(plan);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        private bool PlanExists(int id)
        {
            return _context.Plans.Any(e => e.Id == id);
        }
    }
}
