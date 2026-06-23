using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NexClone.Backend.Models
{
    public class Voice
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        [MaxLength(100)]
        public string? VoiceName { get; set; }

        [MaxLength(100)]
        public string? Name { get; set; }

        [MaxLength(10)]
        public string? Gender { get; set; }

        [MaxLength(100)]
        public string? Accent { get; set; }

        [MaxLength(100)]
        public string? DemoAudio { get; set; }

        [MaxLength(100)]
        public string? GeminiVoice { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsPremium { get; set; } = false;
        public int Order { get; set; } = 0;
    }

    public class Dialect
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        [MaxLength(100)]
        public string? Name { get; set; }

        [MaxLength(200)]
        public string? Value { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsPremium { get; set; } = false;
        public int Order { get; set; } = 0;
    }

    public class Emotion
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        [MaxLength(100)]
        public string? Name { get; set; }

        [MaxLength(200)]
        public string? Value { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsPremium { get; set; } = false;
        public int Order { get; set; } = 0;
    }

    public class Style
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        [MaxLength(200)]
        public string? Name { get; set; }

        [MaxLength(300)]
        public string? Value { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsPremium { get; set; } = false;
        public int Order { get; set; } = 0;
    }
}
