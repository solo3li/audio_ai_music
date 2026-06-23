using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace NexClone.Backend.Models
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        public string FullName { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public bool IsVerified { get; set; } = false;
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsStaff { get; set; } = false;
        
        // Credits Economy
        public decimal AvailableCredits { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public UserPhoneNumber? PhoneNumberDetails { get; set; }
        public ICollection<EmailVerification> EmailVerifications { get; set; } = new List<EmailVerification>();
        public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
