using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexClone.Backend.Models
{
    public class GenerationHistory
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty; // text-to-voice, voice-to-text, gpt, bg-remover, img-to-txt

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(20)]
        public string Duration { get; set; } = "0:00";

        [MaxLength(20)]
        public string Status { get; set; } = "completed"; // processing, completed, failed

        [MaxLength(50)]
        public string Lang { get; set; } = "Auto";

        [MaxLength(100)]
        public string Voice { get; set; } = "-";

        [MaxLength(1000)]
        public string FileUrl { get; set; } = string.Empty;

        public string ResultText { get; set; } = string.Empty;

        public string InputText { get; set; } = string.Empty;

        public decimal CreditsUsed { get; set; } = 0;

        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; } = null!;
    }
}
