using System;
using System.ComponentModel.DataAnnotations;

namespace NexClone.Backend.Models
{
    public class DeviceFingerprint
    {
        [Key]
        public int Id { get; set; }

        public Guid UserId { get; set; }
        public ApplicationUser User { get; set; } = null!;

        [Required]
        public string IpAddress { get; set; } = string.Empty;

        public string UserAgent { get; set; } = string.Empty;

        public string FingerprintHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
