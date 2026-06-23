using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System.Linq;

namespace NexClone.Backend.Services
{
    public class ToolPolicy
    {
        public bool Enabled { get; set; } = false;
        // -1 means unlimited
        public int MaxCharsPerRequest { get; set; } = 150; 
        public long MaxFileSizeMb { get; set; } = 25;
        // Cost per unit. If not set, we will fallback to LegacyDbContext
        public decimal? CostPerUnit { get; set; }
        public int BlockSize { get; set; } = 1;
    }

    public class PolicyValidationResult
    {
        public bool IsAllowed { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public decimal TotalCost { get; set; }
    }

    public class UsagePolicyService
    {
        private readonly ApplicationDbContext _context;

        public UsagePolicyService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PolicyValidationResult> ValidateAndChargeAsync(Guid userId, string toolId, decimal usageAmountForLimits, decimal? usageAmountForCost = null)
        {
            var user = await _context.Users
                .Include(u => u.Subscriptions)
                    .ThenInclude(s => s.Plan)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) 
                return new PolicyValidationResult { IsAllowed = false, ErrorMessage = "User not found." };

            Plan targetPlan = null;
            var activeSubscription = user.Subscriptions
                .FirstOrDefault(s => s.Status.ToLower() == "active" && s.EndDate > DateTime.UtcNow);

            if (activeSubscription != null)
            {
                targetPlan = activeSubscription.Plan;
            }
            else if (user.IsStaff)
            {
                // Fallback for staff without subscription so they can still test but get charged
                targetPlan = await _context.Plans.FirstOrDefaultAsync() ?? new Plan();
            }
            else
            {
                return new PolicyValidationResult { IsAllowed = false, ErrorMessage = "No active subscription found." };
            }

            var toolPolicy = GetToolPolicy(targetPlan, toolId);
            if (user.IsStaff) 
            {
                toolPolicy.Enabled = true;
                toolPolicy.MaxCharsPerRequest = -1;
                toolPolicy.MaxFileSizeMb = -1;
            }

            if (!toolPolicy.Enabled)
                return new PolicyValidationResult { IsAllowed = false, ErrorMessage = "Your current plan does not have access to this tool." };

            if (toolId == "text-to-voice" && toolPolicy.MaxCharsPerRequest != -1 && usageAmountForLimits > toolPolicy.MaxCharsPerRequest)
                return new PolicyValidationResult { IsAllowed = false, ErrorMessage = $"Your current plan allows a maximum of {toolPolicy.MaxCharsPerRequest} characters per request." };
            
            if (toolId == "voice-to-text" && toolPolicy.MaxFileSizeMb != -1 && usageAmountForLimits > (toolPolicy.MaxFileSizeMb * 1024 * 1024))
                return new PolicyValidationResult { IsAllowed = false, ErrorMessage = $"File too large. Maximum allowed size is {toolPolicy.MaxFileSizeMb}MB." };

            decimal costPerUnit = toolPolicy.CostPerUnit ?? GetLegacyCostPerUnit(toolId);
            decimal amountForCost = usageAmountForCost ?? usageAmountForLimits;
            
            if (toolId == "voice-to-text" && usageAmountForCost == null)
            {
                amountForCost = usageAmountForLimits / 102400m; 
            }

            if (toolPolicy.BlockSize > 1)
            {
                amountForCost = amountForCost / toolPolicy.BlockSize;
            }

            decimal totalCost = amountForCost * costPerUnit;

            if (user.AvailableCredits < totalCost)
            {
                return new PolicyValidationResult { IsAllowed = false, ErrorMessage = $"Insufficient credits. This requires {totalCost:F2} credits." };
            }

            user.AvailableCredits -= totalCost;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return new PolicyValidationResult { IsAllowed = true, TotalCost = totalCost };
        }

        public ToolPolicy GetToolPolicy(Plan plan, string toolId)
        {
            var policy = new ToolPolicy();
            if (plan == null) return policy;

            if (toolId == "text-to-voice")
            {
                policy.Enabled = plan.TtsEnabled;
                policy.MaxCharsPerRequest = plan.TtsMaxCharsPerRequest;
                policy.CostPerUnit = plan.TtsCostPerChar;
                policy.BlockSize = plan.TtsCharactersBlock;
            }
            else if (toolId == "voice-to-text")
            {
                policy.Enabled = plan.SttEnabled;
                policy.MaxFileSizeMb = plan.SttMaxFileSizeMb;
                policy.CostPerUnit = plan.SttCostPerMinute;
            }

            return policy;
        }

        private decimal GetLegacyCostPerUnit(string toolId)
        {
            return 1m;
        }

        public async Task<PolicyValidationResult> EstimateCostAsync(Guid userId, string toolId, decimal usageAmountForLimits, decimal? usageAmountForCost = null)
        {
            var user = await _context.Users
                .Include(u => u.Subscriptions)
                    .ThenInclude(s => s.Plan)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) 
                return new PolicyValidationResult { IsAllowed = false, ErrorMessage = "User not found." };

            Plan targetPlan = null;
            var activeSubscription = user.Subscriptions
                .FirstOrDefault(s => s.Status.ToLower() == "active" && s.EndDate > DateTime.UtcNow);

            if (activeSubscription != null)
            {
                targetPlan = activeSubscription.Plan;
            }
            else if (user.IsStaff)
            {
                targetPlan = await _context.Plans.FirstOrDefaultAsync() ?? new Plan();
            }
            else
            {
                return new PolicyValidationResult { IsAllowed = false, ErrorMessage = "No active subscription found." };
            }

            var toolPolicy = GetToolPolicy(targetPlan, toolId);
            if (user.IsStaff) 
            {
                toolPolicy.Enabled = true;
                toolPolicy.MaxCharsPerRequest = -1;
                toolPolicy.MaxFileSizeMb = -1;
            }

            if (!toolPolicy.Enabled)
                return new PolicyValidationResult { IsAllowed = false, ErrorMessage = "Your current plan does not have access to this tool." };

            if (toolId == "text-to-voice" && toolPolicy.MaxCharsPerRequest != -1 && usageAmountForLimits > toolPolicy.MaxCharsPerRequest)
                return new PolicyValidationResult { IsAllowed = false, ErrorMessage = $"Your current plan allows a maximum of {toolPolicy.MaxCharsPerRequest} characters per request." };
            
            if (toolId == "voice-to-text" && toolPolicy.MaxFileSizeMb != -1 && usageAmountForLimits > (toolPolicy.MaxFileSizeMb * 1024 * 1024))
                return new PolicyValidationResult { IsAllowed = false, ErrorMessage = $"File too large. Maximum allowed size is {toolPolicy.MaxFileSizeMb}MB." };

            decimal costPerUnit = toolPolicy.CostPerUnit ?? GetLegacyCostPerUnit(toolId);
            decimal amountForCost = usageAmountForCost ?? usageAmountForLimits;
            
            if (toolId == "voice-to-text" && usageAmountForCost == null)
                amountForCost = usageAmountForLimits / 102400m; 

            if (toolPolicy.BlockSize > 1)
                amountForCost = amountForCost / toolPolicy.BlockSize;

            decimal totalCost = amountForCost * costPerUnit;

            return new PolicyValidationResult { IsAllowed = true, TotalCost = totalCost };
        }
    }
}
