using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexClone.Backend.Models
{
    public class Payment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string PaymentId { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        [MaxLength(10)]
        public string Currency { get; set; } = "USD";

        [Required]
        [MaxLength(20)]
        public string Method { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string Status { get; set; } = "Pending";

        [MaxLength(300)]
        public string? Notes { get; set; }

        [MaxLength(500)]
        public string? ReceiptUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [Required]
        public Guid UserId { get; set; }
        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; } = null!;

        public int? PlanId { get; set; }
        [ForeignKey(nameof(PlanId))]
        public Plan? Plan { get; set; }

        public int? SubscriptionId { get; set; }
        [ForeignKey(nameof(SubscriptionId))]
        public Subscription? Subscription { get; set; }
    }
}
