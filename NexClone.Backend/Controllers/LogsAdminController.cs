using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading.Tasks;

namespace NexClone.Backend.Controllers
{
    public class LogsAdminController : Controller
    {
        public async Task<IActionResult> Index()
        {
            var logFilePath = Path.Combine(Directory.GetCurrentDirectory(), "logs", "system.log");
            string logs = "Log file not found or empty.";

            if (System.IO.File.Exists(logFilePath))
            {
                try
                {
                    // Read last 1000 lines
                    var lines = await System.IO.File.ReadAllLinesAsync(logFilePath);
                    if (lines.Length > 1000)
                    {
                        logs = string.Join("\n", lines[^1000..]);
                    }
                    else
                    {
                        logs = string.Join("\n", lines);
                    }
                }
                catch (System.Exception ex)
                {
                    logs = $"Error reading log file: {ex.Message}";
                }
            }

            return View("Index", logs);
        }
        
        [HttpPost]
        public IActionResult ClearLogs()
        {
            var logFilePath = Path.Combine(Directory.GetCurrentDirectory(), "logs", "system.log");
            if (System.IO.File.Exists(logFilePath))
            {
                try
                {
                    System.IO.File.WriteAllText(logFilePath, string.Empty);
                }
                catch { }
            }
            return RedirectToAction(nameof(Index));
        }
    }
}
