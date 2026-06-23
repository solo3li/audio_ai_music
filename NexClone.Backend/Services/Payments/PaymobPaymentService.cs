using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using NexClone.Backend.Models.Payments;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;

namespace NexClone.Backend.Services.Payments
{
    public class PaymobPaymentService : IPaymentService
    {
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;

        public PaymobPaymentService(ApplicationDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
        }

        public async Task<PaymentResult> CreatePaymobIntentAsync(int planId, string userId, string userEmail, string userFirstName, string userLastName, string phoneNumber)
        {
            // 1. Fetch Plan
            var plan = await _context.Plans.FindAsync(planId);
            if (plan == null) return new PaymentResult { IsSuccess = false, ErrorMessage = "Plan not found." };

            // 2. Fetch active Paymob Config
            var paymobConfig = await _context.PaymentGatewayConfigs
                .FirstOrDefaultAsync(c => c.ProviderName == "Paymob" && c.IsActive);
            
            if (paymobConfig == null || string.IsNullOrEmpty(paymobConfig.SecretKey) || string.IsNullOrEmpty(paymobConfig.PublicKey))
            {
                return new PaymentResult { IsSuccess = false, ErrorMessage = "Paymob configuration is missing or inactive." };
            }

            // 3. Prepare payload (amount in cents)
            int amountCents = (int)(plan.PriceEgp * 100);
            
            // Replicate Python Intention API Payload
            var payload = new
            {
                amount = amountCents,
                currency = "EGP",
                payment_methods = new[] { 4928859, 4928858 }, // We can read this from config later if needed
                items = new[]
                {
                    new
                    {
                        name = (plan.Name.Length > 50) ? plan.Name.Substring(0, 50) : plan.Name,
                        amount = amountCents,
                        description = $"Subscription for {plan.Name}",
                        quantity = 1
                    }
                },
                billing_data = new
                {
                    apartment = "NA",
                    first_name = (userId.Length > 50) ? userId.Substring(0, 50) : userId, // We map this to UserID for the webhook
                    last_name = (plan.Name.Length > 50) ? plan.Name.Substring(0, 50) : plan.Name, // Map to Plan Name
                    street = "NA",
                    building = "NA",
                    phone_number = string.IsNullOrEmpty(phoneNumber) ? "+201553963637" : phoneNumber,
                    country = "EG",
                    email = string.IsNullOrEmpty(userEmail) ? "test@mail.com" : userEmail,
                    floor = "NA",
                    state = "NA",
                    city = "NA"
                },
                expiration = 3600
            };

            // 4. Send Request to Paymob Intention API
            var request = new HttpRequestMessage(HttpMethod.Post, "https://accept.paymob.com/v1/intention/");
            request.Headers.Authorization = new AuthenticationHeaderValue("Token", paymobConfig.SecretKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(responseContent);
                var root = doc.RootElement;
                if (root.TryGetProperty("client_secret", out var clientSecretElement))
                {
                    string clientSecret = clientSecretElement.GetString() ?? "";
                    
                    // Unified Checkout URL
                    string checkoutUrl = $"https://accept.paymob.com/unifiedcheckout/?publicKey={paymobConfig.PublicKey}&clientSecret={clientSecret}";
                    
                    return new PaymentResult
                    {
                        IsSuccess = true,
                        CheckoutUrl = checkoutUrl
                    };
                }
                return new PaymentResult { IsSuccess = false, ErrorMessage = "No client secret returned from Paymob." };
            }

            return new PaymentResult { IsSuccess = false, ErrorMessage = $"Paymob Error: {responseContent}" };
        }
    }
}
