using System;
using System.ComponentModel.DataAnnotations;

namespace NexClone.Backend.Models
{
    public class ApiConfiguration
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string ProviderName { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string ApiKey { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? BaseUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public string? AdditionalSettings { get; set; } // JSON format config

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
