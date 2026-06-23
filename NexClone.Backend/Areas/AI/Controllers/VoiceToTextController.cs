using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NexClone.Backend.Models;
using NexClone.Backend.Services;
using NexClone.Backend.Services.AI;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace NexClone.Backend.Areas.AI.Controllers
{
    [Area("AI")]
    [Route("api/ai/voice-to-text")]
    [ApiController]
    [Authorize] // Requires JWT
    [EnableRateLimiting("ApiPolicy")]
    public class VoiceToTextController : ControllerBase
    {
        private readonly ISttService _sttService;
        private readonly ApplicationDbContext _dbContext;
        private readonly UsagePolicyService _usagePolicy;

        private readonly IMediaService _mediaService;

        public VoiceToTextController(ISttService sttService, ApplicationDbContext dbContext, UsagePolicyService usagePolicy, IMediaService mediaService)
        {
            _sttService = sttService;
            _dbContext = dbContext;
            _usagePolicy = usagePolicy;
            _mediaService = mediaService;
        }

        public class TranscribeRequest
        {
            public string FileId { get; set; }
            public bool Translate { get; set; } = false;
            public string TargetLanguage { get; set; } = "en";
        }

        [HttpPost("transcribe")]
        public async Task<IActionResult> TranscribeAudio([FromBody] TranscribeRequest request)
        {
            if (string.IsNullOrEmpty(request.FileId))
                return BadRequest(new { error = "No fileId provided" });

            byte[] audioData;
            try
            {
                audioData = await _mediaService.DownloadFileAsync(request.FileId);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Could not retrieve file from storage", details = ex.Message });
            }

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            double audioDurationMinutes = 1.0;
            try
            {
                var tempFile = System.IO.Path.GetTempFileName();
                System.IO.File.WriteAllBytes(tempFile, audioData);
                using (var tfile = TagLib.File.Create(tempFile))
                {
                    audioDurationMinutes = tfile.Properties.Duration.TotalMinutes;
                }
                System.IO.File.Delete(tempFile);
                
                // Ensure at least 0.01 minutes
                if (audioDurationMinutes <= 0) audioDurationMinutes = 0.01;
            }
            catch (Exception)
            {
                // Fallback if audio format is unrecognized or invalid
                audioDurationMinutes = 1.0;
            }

            var policyResult = await _usagePolicy.ValidateAndChargeAsync(userId, "voice-to-text", audioData.Length, (decimal)audioDurationMinutes);
            if (!policyResult.IsAllowed)
                return BadRequest(new { error = policyResult.ErrorMessage });

            var cost = policyResult.TotalCost;

            try
            {
                var result = await _sttService.TranscribeAudioAsync(audioData, request.FileId, "audio/mpeg", request.Translate, request.TargetLanguage);

                if (!result.Success)
                {
                    return StatusCode(500, new { error = result.ErrorMessage });
                }

                var history = new GenerationHistory
                {
                    UserId = userId,
                    Type = "voice-to-text",
                    Title = request.FileId.Split('/').LastOrDefault() ?? "Audio File",
                    FileUrl = request.FileId,
                    Status = "completed",
                    Lang = request.TargetLanguage,
                    ResultText = request.Translate ? result.TranslatedText : result.OriginalText,
                    CreditsUsed = cost
                };
                _dbContext.GenerationHistories.Add(history);
                await _dbContext.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    original_text = result.OriginalText,
                    translated_text = result.TranslatedText,
                    target_language = result.TargetLanguage
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error during transcription.", details = ex.Message });
            }
        }
        public class EstimateRequest
        {
            public long FileSizeBytes { get; set; }
            public double DurationMinutes { get; set; }
        }

        [HttpPost("estimate")]
        public async Task<IActionResult> EstimateAudio([FromBody] EstimateRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            double duration = request.DurationMinutes <= 0 ? 0.01 : request.DurationMinutes;

            var policyResult = await _usagePolicy.EstimateCostAsync(userId, "voice-to-text", request.FileSizeBytes, (decimal)duration);
            if (!policyResult.IsAllowed)
                return BadRequest(new { error = policyResult.ErrorMessage });

            return Ok(new { estimatedCost = policyResult.TotalCost });
        }
    }
}
