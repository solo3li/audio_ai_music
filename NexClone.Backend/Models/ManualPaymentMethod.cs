using System;
using System.ComponentModel.DataAnnotations;

namespace NexClone.Backend.Models
{
    public class ManualPaymentMethod
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string AccountDetails { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Instructions { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
