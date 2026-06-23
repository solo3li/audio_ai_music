using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using NexClone.Backend.Services;
using NexClone.Backend.Services.AI;
using System.Text;
using System.Text.Json;

namespace NexClone.Backend.Controllers.Api
{
    [ApiController]
    [Route("api/video-editor")]
    // [Authorize]
    public class AiVideoEditorController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ITtsService _ttsService;
        private readonly IMediaService _minioMediaService;

        public AiVideoEditorController(
            ApplicationDbContext dbContext,
            IHttpClientFactory httpClientFactory,
            ITtsService ttsService,
            IMediaService minioMediaService)
        {
            _dbContext = dbContext;
            _httpClientFactory = httpClientFactory;
            _ttsService = ttsService;
            _minioMediaService = minioMediaService;
        }

        public class VoiceSwapRequest
        {
            public string SourceAudioUrl { get; set; } = string.Empty;
            public string VoiceId { get; set; } = string.Empty;
            public string Emotion { get; set; } = string.Empty;
        }

        public class SubtitlesRequest
        {
            public string SourceAudioUrl { get; set; } = string.Empty;
        }

        [HttpPost("voice-swap")]
        public async Task<IActionResult> VoiceSwap([FromBody] VoiceSwapRequest request)
        {
            try
            {
                // 1. Download source audio
                var client = _httpClientFactory.CreateClient();
                var audioBytes = await client.GetByteArrayAsync(request.SourceAudioUrl);

                // 2. Call Whisper to get text
                var openAiConfig = await _dbContext.ApiConfigurations.FirstOrDefaultAsync(c => c.ProviderName == "OpenAI" && c.IsActive);
                if (openAiConfig == null) return BadRequest(new { success = false, message = "OpenAI configuration missing." });

                string transcript = await TranscribeAudioAsync(audioBytes, openAiConfig.ApiKey, "json");
                if (string.IsNullOrWhiteSpace(transcript))
                    return BadRequest(new { success = false, message = "Could not transcribe audio." });

                // 3. Resolve Voice
                long.TryParse(request.VoiceId, out var voiceId);
                var voice = await _dbContext.Voices.FirstOrDefaultAsync(v => v.Id == voiceId);
                string voiceName = voice?.VoiceName ?? "alloy";

                // Resolve Emotion/Style
                string styleInstruction = "";
                if (!string.IsNullOrWhiteSpace(request.Emotion))
                {
                    long.TryParse(request.Emotion, out var emotionId);
                    var emotion = await _dbContext.Emotions.FirstOrDefaultAsync(e => e.Id == emotionId);
                    if (emotion != null) styleInstruction = emotion.Value ?? emotion.Name ?? "";
                }

                // 4. Synthesize new audio via TtsService
                var (audioStream, contentType, ext) = await _ttsService.GenerateAudioAsync(transcript, "arabic", voiceName, styleInstruction);

                // 5. Upload to MinIO
                string fileName = $"voiceswap_{Guid.NewGuid():N}.{ext}";
                string minioUrl = await _minioMediaService.UploadFileAsync(audioStream, fileName, contentType, "video-editor-swaps");

                return Ok(new { success = true, url = minioUrl, message = "Voice swapped successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("subtitles")]
        public async Task<IActionResult> GenerateSubtitles([FromBody] SubtitlesRequest request)
        {
            try
            {
                // 1. Download source audio
                var client = _httpClientFactory.CreateClient();
                var audioBytes = await client.GetByteArrayAsync(request.SourceAudioUrl);

                // 2. Call Whisper (verbose_json)
                var openAiConfig = await _dbContext.ApiConfigurations.FirstOrDefaultAsync(c => c.ProviderName == "OpenAI" && c.IsActive);
                if (openAiConfig == null) return BadRequest(new { success = false, message = "OpenAI configuration missing." });

                var segments = await TranscribeAudioSegmentsAsync(audioBytes, openAiConfig.ApiKey);

                return Ok(new { success = true, subtitles = segments });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private async Task<string> TranscribeAudioAsync(byte[] audioData, string apiKey, string format = "text")
        {
            using var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            using var content = new MultipartFormDataContent();
            var audioContent = new ByteArrayContent(audioData);
            audioContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("audio/mpeg");
            content.Add(audioContent, "file", "audio.mp3");
            content.Add(new StringContent("whisper-1"), "model");
            content.Add(new StringContent(format), "response_format");

            var response = await client.PostAsync("https://api.openai.com/v1/audio/transcriptions", content);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Whisper API Error: {error}");
            }

            if (format == "json")
            {
                 var jsonString = await response.Content.ReadAsStringAsync();
                 using var doc = JsonDocument.Parse(jsonString);
                 return doc.RootElement.GetProperty("text").GetString() ?? "";
            }

            return await response.Content.ReadAsStringAsync();
        }

        private async Task<List<object>> TranscribeAudioSegmentsAsync(byte[] audioData, string apiKey)
        {
            using var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            using var content = new MultipartFormDataContent();
            var audioContent = new ByteArrayContent(audioData);
            audioContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("audio/mpeg");
            content.Add(audioContent, "file", "audio.mp3");
            content.Add(new StringContent("whisper-1"), "model");
            content.Add(new StringContent("verbose_json"), "response_format");

            var response = await client.PostAsync("https://api.openai.com/v1/audio/transcriptions", content);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Whisper API Error: {error}");
            }

            var jsonString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonString);

            var resultList = new List<object>();

            if (doc.RootElement.TryGetProperty("segments", out var segments))
            {
                foreach (var segment in segments.EnumerateArray())
                {
                    double start = segment.GetProperty("start").GetDouble();
                    double end = segment.GetProperty("end").GetDouble();
                    string text = segment.GetProperty("text").GetString() ?? "";

                    resultList.Add(new {
                        text = text.Trim(),
                        startTime = start,
                        duration = end - start
                    });
                }
            }
            return resultList;
        }
    }
}
