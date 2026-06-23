using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexClone.Backend.Models
{
    public class ToolConfiguration
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public string ToolName { get; set; } = string.Empty; // e.g. "text-to-voice", "bg-remover"

        [MaxLength(100)]
        public string ProviderName { get; set; } = string.Empty; // e.g. "Gemini", "OpenAI"

        [MaxLength(100)]
        public string ModelName { get; set; } = string.Empty; // e.g. "gemini-2.0-flash-exp"

        public bool IsActive { get; set; } = true;
        public bool IsMaintenanceMode { get; set; } = false;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // JSON field for any extra settings the tool might need
        [Column(TypeName = "jsonb")]
        public string AdditionalSettings { get; set; } = "{}";
    }
}
