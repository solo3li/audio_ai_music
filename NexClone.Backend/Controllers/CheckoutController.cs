using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using NexClone.Backend.Models;
using NexClone.Backend.Services.Payments;
using System.Threading.Tasks;

namespace NexClone.Backend.Controllers
{
    [Authorize]
    public class CheckoutController : Controller
    {
        private readonly IPaymentService _paymentService;
        private readonly UserManager<ApplicationUser> _userManager;

        public CheckoutController(IPaymentService paymentService, UserManager<ApplicationUser> userManager)
        {
            _paymentService = paymentService;
            _userManager = userManager;
        }

        public async Task<IActionResult> Pay(int planId, string currency = "USD")
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            if (currency == "EGP")
            {
                var result = await _paymentService.CreatePaymobIntentAsync(
                    planId, 
                    user.Id.ToString(), 
                    user.Email ?? "user@example.com", 
                    user.UserName ?? "Guest", 
                    "User", 
                    user.PhoneNumber ?? ""
                );

                if (!result.IsSuccess)
                {
                    ViewData["ErrorMessage"] = result.ErrorMessage;
                    return View("Error");
                }

                ViewData["CheckoutUrl"] = result.CheckoutUrl;
                return View();
            }
            else if (currency == "USD")
            {
                // PayPal Integration
                // For now, redirect to a generic success or mock checkout for PayPal
                // You would typically call an IPaymentService method for PayPal here
                ViewData["CheckoutUrl"] = $"/api/webhooks/paypal-mock-success?planId={planId}&userId={user.Id}";
                return View("PayPalCheckout"); // A view showing the PayPal button
            }

            return BadRequest("Invalid Currency");
        }
    }
}
