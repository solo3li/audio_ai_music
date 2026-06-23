using System;
using System.ComponentModel.DataAnnotations;

namespace NexClone.Backend.Models
{
    public class PaymentGatewayConfig
    {
        public int Id { get; set; }

        [Required]
        public string ProviderName { get; set; } = string.Empty; // "Paymob" or "PayPal"

        // Paymob specific
        public string? PublicKey { get; set; }
        public string? SecretKey { get; set; }
        public string? HmacSecret { get; set; }
        public string? IntegrationId { get; set; }
        public string? IframeId { get; set; }

        // PayPal specific
        public string? ClientId { get; set; }
        public string? ClientSecret { get; set; }
        public string? ApiBase { get; set; } // e.g. "https://api-m.sandbox.paypal.com"

        public bool IsActive { get; set; } = true;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
