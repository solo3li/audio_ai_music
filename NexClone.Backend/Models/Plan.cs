using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace NexClone.Backend.Models
{
    public class Plan
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string NameAr { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(1000)]
        public string? DescriptionAr { get; set; }

        public int DurationDays { get; set; }
        
        public int GracePeriodDays { get; set; } = 3;

        public decimal PriceUsd { get; set; }
        public decimal PriceEgp { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Economy
        public decimal MonthlyCredits { get; set; } = 0;
        // Text-To-Voice (TTS) Settings
        public bool TtsEnabled { get; set; } = true;
        public int TtsMaxCharsPerRequest { get; set; } = 3000;
        public int TtsCharactersBlock { get; set; } = 1;
        public decimal TtsCostPerChar { get; set; } = 0.001m;
        public bool TtsCustomInstructionsEnabled { get; set; } = false;

        // Voice-To-Text (STT) Settings
        public bool SttEnabled { get; set; } = true;
        public int SttMaxFileSizeMb { get; set; } = 25;
        public decimal SttCostPerMinute { get; set; } = 1.0m;

        // Free Trial Flag
        public bool IsFreeTrial { get; set; } = false;

        // Navigation
        public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
