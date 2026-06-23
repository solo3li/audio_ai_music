using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using NexClone.Backend.Models.ViewModels;

namespace NexClone.Backend.Controllers;

public class HomeController : Controller
{
    private readonly ApplicationDbContext _context;

    public HomeController(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var model = new DashboardViewModel();

        // 1. Total Users
        model.TotalUsers = await _context.Users.CountAsync();

        // 2. Active Subscriptions
        model.ActiveSubscriptions = await _context.Subscriptions
            .Where(s => s.Status == "active")
            .CountAsync();

        // 3. Total Revenue
        model.TotalRevenue = await _context.Payments
            .Where(p => p.Status == "successful" || p.Status == "paid")
            .SumAsync(p => p.Amount);

        // 4. Recent Activity (Last 5 payments)
        model.RecentActivity = await _context.Payments
            .Include(p => p.User)
            .Include(p => p.Plan)
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .ToListAsync();

        // 5. Chart Data (Revenue by month for the last 6 months)
        var sixMonthsAgo = System.DateTime.UtcNow.AddMonths(-6);
        
        var monthlyRevenue = await _context.Payments
            .Where(p => (p.Status == "successful" || p.Status == "paid") && p.CreatedAt >= sixMonthsAgo)
            .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
            .Select(g => new 
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Total = g.Sum(p => p.Amount)
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync();

        // Ensure we format the labels and populate data
        foreach (var stat in monthlyRevenue)
        {
            var date = new System.DateTime(stat.Year, stat.Month, 1);
            model.ChartLabels.Add(date.ToString("MMM yyyy"));
            model.ChartData.Add(stat.Total);
        }

        return View(model);
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
