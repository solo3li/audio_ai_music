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
    public class AiEditRequest
    {
        public string Prompt { get; set; }
        public JsonElement Timeline { get; set; }
    }

    public class AiVideoGenRequest
    {
        public string Prompt { get; set; }
    }

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

        [HttpPost("voice-swap")]
        [RequestSizeLimit(524288000)]
        [RequestFormLimits(MultipartBodyLengthLimit = 524288000)]
        public async Task<IActionResult> VoiceSwap([FromForm] IFormFile file, [FromForm] string? voiceId = null, [FromForm] string? emotion = null)
        {
            try
            {
                if (file == null || file.Length == 0) return BadRequest(new { success = false, message = "No file provided" });

                using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                var audioBytes = ms.ToArray();

                if (!file.FileName.EndsWith(".mp3", StringComparison.OrdinalIgnoreCase) && 
                    !file.FileName.EndsWith(".wav", StringComparison.OrdinalIgnoreCase))
                {
                    audioBytes = await ConvertToMp3Async(audioBytes);
                }

                // 2. Call Whisper to get text
                var openAiConfig = await _dbContext.ApiConfigurations.FirstOrDefaultAsync(c => c.ProviderName == "OpenAI" && c.IsActive);
                if (openAiConfig == null) return BadRequest(new { success = false, message = "OpenAI configuration missing." });

                string transcript = await TranscribeAudioAsync(audioBytes, openAiConfig.ApiKey, "json");
                if (string.IsNullOrWhiteSpace(transcript))
                    return BadRequest(new { success = false, message = "Could not transcribe audio." });

                // 3. Resolve Voice
                long.TryParse(voiceId, out var parsedVoiceId);
                var voice = await _dbContext.Voices.FirstOrDefaultAsync(v => v.Id == parsedVoiceId);
                string voiceName = voice?.VoiceName ?? "alloy";

                // Resolve Emotion/Style
                string styleInstruction = "";
                if (!string.IsNullOrWhiteSpace(emotion))
                {
                    long.TryParse(emotion, out var emotionId);
                    var emotionObj = await _dbContext.Emotions.FirstOrDefaultAsync(e => e.Id == emotionId);
                    if (emotionObj != null) styleInstruction = emotionObj.Value ?? emotionObj.Name ?? "";
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
                Console.WriteLine($"[AiVideoEditor] ERROR: {ex}");
                return StatusCode(500, new { success = false, message = ex.ToString() });
            }
        }

        [HttpPost("subtitles")]
        [RequestSizeLimit(524288000)]
        [RequestFormLimits(MultipartBodyLengthLimit = 524288000)]
        public async Task<IActionResult> GenerateSubtitles([FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0) return BadRequest(new { success = false, message = "No file provided" });

                using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                var audioBytes = ms.ToArray();

                if (!file.FileName.EndsWith(".mp3", StringComparison.OrdinalIgnoreCase) && 
                    !file.FileName.EndsWith(".wav", StringComparison.OrdinalIgnoreCase))
                {
                    audioBytes = await ConvertToMp3Async(audioBytes);
                }

                // 2. Call Whisper (verbose_json)
                var openAiConfig = await _dbContext.ApiConfigurations.FirstOrDefaultAsync(c => c.ProviderName == "OpenAI" && c.IsActive);
                if (openAiConfig == null) return BadRequest(new { success = false, message = "OpenAI configuration missing." });

                var segments = await TranscribeAudioSegmentsAsync(audioBytes, openAiConfig.ApiKey);

                return Ok(new { success = true, subtitles = segments });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AiVideoEditor] ERROR: {ex}");
                return StatusCode(500, new { success = false, message = ex.ToString() });
            }
        }

        [HttpPost("ai-edit")]
        public async Task<IActionResult> AiEdit([FromBody] AiEditRequest request)
        {
            try
            {
                var openAiConfig = await _dbContext.ApiConfigurations.FirstOrDefaultAsync(c => c.ProviderName == "OpenAI" && c.IsActive);
                if (openAiConfig == null) return BadRequest(new { error = "OpenAI configuration missing." });

                using var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {openAiConfig.ApiKey}");
                
                var payload = new {
                    model = "gpt-4o",
                    messages = new[] {
                        new { role = "system", content = "You are an AI video timeline editor. The user provides a timeline JSON and a prompt. Modify the timeline JSON based on the prompt. Return ONLY valid JSON array without markdown blocks. Do not wrap in ```json." },
                        new { role = "user", content = $"Prompt: {request.Prompt}\nTimeline: {request.Timeline.GetRawText()}" }
                    }
                };
                
                var res = await client.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", payload);
                var resultStr = await res.Content.ReadAsStringAsync();
                
                using var jsonDoc = JsonDocument.Parse(resultStr);
                var contentStr = jsonDoc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                contentStr = contentStr.Trim();
                if (contentStr.StartsWith("```json")) contentStr = contentStr.Substring(7);
                if (contentStr.StartsWith("```")) contentStr = contentStr.Substring(3);
                if (contentStr.EndsWith("```")) contentStr = contentStr.Substring(0, contentStr.Length - 3);

                var newTimeline = JsonDocument.Parse(contentStr.Trim());
                
                return Ok(new { timeline = newTimeline.RootElement });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("ai-video-gen")]
        public async Task<IActionResult> AiVideoGen([FromBody] AiVideoGenRequest request)
        {
            try
            {
                var openAiConfig = await _dbContext.ApiConfigurations.FirstOrDefaultAsync(c => c.ProviderName == "OpenAI" && c.IsActive);
                if (openAiConfig == null) return BadRequest(new { error = "OpenAI configuration missing." });

                using var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {openAiConfig.ApiKey}");
                
                var payload = new {
                    model = "gpt-4o",
                    messages = new[] {
                        new { role = "system", content = "Create a short video plan based on the prompt. Return JSON with exactly this structure: { \"title_card\": { \"text\": \"string\", \"duration\": number, \"color\": \"#hex\" }, \"sections\": [ { \"keyword\": \"string\", \"duration\": number, \"filter\": \"css string\", \"text\": \"string\", \"text_y\": number } ], \"color_grade\": \"css string\" }. Ensure the response is pure JSON without markdown blocks." },
                        new { role = "user", content = $"Prompt: {request.Prompt}" }
                    }
                };
                
                var res = await client.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", payload);
                var resultStr = await res.Content.ReadAsStringAsync();
                
                using var jsonDoc = JsonDocument.Parse(resultStr);
                var contentStr = jsonDoc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                contentStr = contentStr.Trim();
                if (contentStr.StartsWith("```json")) contentStr = contentStr.Substring(7);
                if (contentStr.StartsWith("```")) contentStr = contentStr.Substring(3);
                if (contentStr.EndsWith("```")) contentStr = contentStr.Substring(0, contentStr.Length - 3);

                var plan = JsonDocument.Parse(contentStr.Trim());
                
                // Parse sections to generate mediaUrls
                var mediaUrls = new List<string>();
                var mediaTypes = new List<string>();
                
                if (plan.RootElement.TryGetProperty("sections", out var sections))
                {
                    foreach (var sec in sections.EnumerateArray())
                    {
                        var keyword = sec.GetProperty("keyword").GetString();
                        // Generate dummy URL based on keyword using Unsplash
                        mediaUrls.Add($"https://source.unsplash.com/1920x1080/?{Uri.EscapeDataString(keyword)}");
                        mediaTypes.Add("image");
                    }
                }

                return Ok(new { 
                    plan = plan.RootElement,
                    mediaUrls = mediaUrls,
                    mediaTypes = mediaTypes,
                    music = ""
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("openai-key")]
        public async Task<IActionResult> GetOpenAiKey()
        {
            var openAiConfig = await _dbContext.ApiConfigurations.FirstOrDefaultAsync(c => c.ProviderName == "OpenAI" && c.IsActive);
            if (openAiConfig == null) return BadRequest(new { error = "OpenAI configuration missing." });
            return Ok(new { apiKey = openAiConfig.ApiKey });
        }

        private async Task<byte[]> ConvertToMp3Async(byte[] inputBytes)
        {
            string tempInput = Path.GetTempFileName();
            string tempOutput = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.mp3");

            try
            {
                await System.IO.File.WriteAllBytesAsync(tempInput, inputBytes);

                var process = new System.Diagnostics.Process
                {
                    StartInfo = new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = "ffmpeg",
                        Arguments = $"-y -i \"{tempInput}\" -vn -acodec libmp3lame -q:a 2 \"{tempOutput}\"",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };

                process.Start();
                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    string error = await process.StandardError.ReadToEndAsync();
                    throw new Exception($"FFmpeg conversion failed: {error}");
                }

                return await System.IO.File.ReadAllBytesAsync(tempOutput);
            }
            finally
            {
                if (System.IO.File.Exists(tempInput)) System.IO.File.Delete(tempInput);
                if (System.IO.File.Exists(tempOutput)) System.IO.File.Delete(tempOutput);
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
