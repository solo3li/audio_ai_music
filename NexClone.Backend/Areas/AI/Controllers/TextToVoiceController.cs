using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using NexClone.Backend.Services;
using NexClone.Backend.Services.AI;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace NexClone.Backend.Areas.AI.Controllers
{
    [Area("AI")]
    [Route("api/ai/text-to-voice")]
    [ApiController]
    [Authorize] // Requires JWT
    [EnableRateLimiting("ApiPolicy")]
    public class TextToVoiceController : ControllerBase
    {
        private readonly ITtsService _ttsService;
        private readonly ApplicationDbContext _dbContext;
        private readonly IWebHostEnvironment _env;
        private readonly UsagePolicyService _usagePolicy;
        private readonly IMediaService _mediaService;

        public TextToVoiceController(ITtsService ttsService, ApplicationDbContext dbContext, IWebHostEnvironment env, UsagePolicyService usagePolicy, IMediaService mediaService)
        {
            _ttsService = ttsService;
            _dbContext = dbContext;
            _env = env;
            _usagePolicy = usagePolicy;
            _mediaService = mediaService;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateAudio([FromBody] TtsRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var policyResult = await _usagePolicy.ValidateAndChargeAsync(userId, "text-to-voice", request.Text.Length);
            if (!policyResult.IsAllowed)
                return BadRequest(new { error = policyResult.ErrorMessage });

            var cost = policyResult.TotalCost;

            try
            {
                var (audioStream, contentType, fileExtension) = await _ttsService.GenerateAudioAsync(
                    request.Text,
                    request.Language,
                    request.VoiceName,
                    request.StyleInstruction
                );

                // Upload to MinIO
                string fileName = $"{Guid.NewGuid()}.{fileExtension}";
                string objectKey = $"text-to-voice/{userId:N}/{DateTime.UtcNow:yyyy-MM}/{fileName}";
                
                audioStream.Position = 0; // Ensure stream is at the beginning
                string fileUrl = await _mediaService.UploadFileAsync(audioStream, objectKey, contentType);

                var history = new GenerationHistory
                {
                    UserId = userId,
                    Type = "text-to-voice",
                    Title = request.Text.Length > 30 ? request.Text.Substring(0, 30) + "..." : request.Text,
                    InputText = request.Text,
                    Status = "completed",
                    Lang = request.Language,
                    Voice = request.VoiceName,
                    FileUrl = fileUrl,
                    CreditsUsed = cost
                };
                _dbContext.GenerationHistories.Add(history);
                await _dbContext.SaveChangesAsync();

                // Return a JSON response with the presigned URL so the frontend can play it directly
                var finalUrl = await _mediaService.GetFileUrlAsync(fileUrl);
                return Ok(new { audioUrl = finalUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating audio", details = ex.Message });
            }
        }

        [HttpPost("estimate")]
        public async Task<IActionResult> EstimateAudio([FromBody] TtsRequest request)
        {
            Console.WriteLine($"[ESTIMATE] Request received: TextLength={request?.Text?.Length}, Language={request?.Language}, VoiceName={request?.VoiceName}");
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                Console.WriteLine($"[ESTIMATE] ModelState Invalid: {errors}");
                return BadRequest(ModelState);
            }

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) 
            {
                Console.WriteLine("[ESTIMATE] Unauthorized: Missing userId");
                return Unauthorized();
            }

            var policyResult = await _usagePolicy.EstimateCostAsync(userId, "text-to-voice", request.Text.Length);
            if (!policyResult.IsAllowed)
            {
                Console.WriteLine($"[ESTIMATE] Policy Denied: {policyResult.ErrorMessage}");
                return BadRequest(new { error = policyResult.ErrorMessage });
            }

            return Ok(new { estimatedCost = policyResult.TotalCost });
        }
    }

    public class TtsRequest
    {
        public string Text { get; set; } = string.Empty;
        public string? Language { get; set; } = "other"; // "arabic" or "other"
        public string? VoiceName { get; set; } = string.Empty;
        public string? StyleInstruction { get; set; } = string.Empty;
    }
}
