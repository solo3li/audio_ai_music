using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;

namespace NexClone.Backend.Models
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<UserPhoneNumber> PhoneNumbers { get; set; } = null!;
        public DbSet<EmailVerification> EmailVerifications { get; set; } = null!;
        public DbSet<Plan> Plans { get; set; } = null!;
        public DbSet<Subscription> Subscriptions { get; set; } = null!;
        public DbSet<Payment> Payments { get; set; } = null!;
        public DbSet<ApiConfiguration> ApiConfigurations { get; set; } = null!;
        public DbSet<PaymentGatewayConfig> PaymentGatewayConfigs { get; set; } = null!;
        public DbSet<GenerationHistory> GenerationHistories { get; set; } = null!;
        public DbSet<ManualPaymentMethod> ManualPaymentMethods { get; set; } = null!;
        public DbSet<DeviceFingerprint> DeviceFingerprints { get; set; } = null!;
        public DbSet<ToolConfiguration> ToolConfigurations { get; set; } = null!;
        public DbSet<EmailTemplate> EmailTemplates { get; set; } = null!;
        public DbSet<AppSetting> AppSettings { get; set; } = null!;

        // TTS Lookups
        public DbSet<Voice> Voices { get; set; } = null!;
        public DbSet<Dialect> Dialects { get; set; } = null!;
        public DbSet<Emotion> Emotions { get; set; } = null!;
        public DbSet<Style> Styles { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure One-to-One relationship for ApplicationUser and UserPhoneNumber
            builder.Entity<ApplicationUser>()
                .HasOne(u => u.PhoneNumberDetails)
                .WithOne(p => p.User)
                .HasForeignKey<UserPhoneNumber>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Subscriptions mapping
            builder.Entity<Subscription>()
                .HasOne(s => s.User)
                .WithMany(u => u.Subscriptions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Subscription>()
                .HasOne(s => s.Plan)
                .WithMany(p => p.Subscriptions)
                .HasForeignKey(s => s.PlanId)
                .OnDelete(DeleteBehavior.Cascade);

            // Payments mapping
            builder.Entity<Payment>()
                .HasOne(p => p.User)
                .WithMany(u => u.Payments)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Payment>()
                .HasOne(p => p.Plan)
                .WithMany(pl => pl.Payments)
                .HasForeignKey(p => p.PlanId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<Payment>()
                .HasOne(p => p.Subscription)
                .WithMany(s => s.Payments)
                .HasForeignKey(p => p.SubscriptionId)
                .OnDelete(DeleteBehavior.SetNull);

            // History mapping
            builder.Entity<GenerationHistory>()
                .HasOne(h => h.User)
                .WithMany()
                .HasForeignKey(h => h.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
