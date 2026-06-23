using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NexClone.Backend.Models;

namespace NexClone.Backend.Services
{
    public class BrevoEmailService : IEmailService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BrevoEmailService> _logger;
        private readonly HttpClient _httpClient;

        public BrevoEmailService(ApplicationDbContext context, ILogger<BrevoEmailService> logger, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient("Brevo");
        }

        public async Task<bool> SendEmailAsync(string toEmail, string toName, string subject, string htmlContent)
        {
            try
            {
                var apiConfig = await _context.ApiConfigurations.FirstOrDefaultAsync(c => c.ProviderName == "Brevo" && c.IsActive);
                if (apiConfig == null || string.IsNullOrWhiteSpace(apiConfig.ApiKey))
                {
                    _logger.LogError("Brevo API configuration is missing or inactive.");
                    return false;
                }

                string senderEmail = "noreply@nexmedia.com";
                string senderName = "NexMedia";

                if (!string.IsNullOrWhiteSpace(apiConfig.AdditionalSettings))
                {
                    try
                    {
                        var settings = JsonSerializer.Deserialize<JsonElement>(apiConfig.AdditionalSettings);
                        if (settings.TryGetProperty("SenderEmail", out var emailProp) && emailProp.ValueKind == JsonValueKind.String)
                        {
                            senderEmail = emailProp.GetString() ?? senderEmail;
                        }
                        if (settings.TryGetProperty("SenderName", out var nameProp) && nameProp.ValueKind == JsonValueKind.String)
                        {
                            senderName = nameProp.GetString() ?? senderName;
                        }
                    }
                    catch (JsonException) { }
                }

                var requestBody = new
                {
                    sender = new { name = senderName, email = senderEmail },
                    to = new[] { new { email = toEmail, name = toName } },
                    subject = subject,
                    htmlContent = htmlContent
                };

                var requestMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
                {
                    Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
                };
                requestMessage.Headers.Add("api-key", apiConfig.ApiKey);
                requestMessage.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var response = await _httpClient.SendAsync(requestMessage);

                if (response.IsSuccessStatusCode)
                {
                    return true;
                }
                else
                {
                    var responseBody = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to send email via Brevo. Status: {response.StatusCode}. Response: {responseBody}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while sending email via Brevo.");
                return false;
            }
        }
    }
}
