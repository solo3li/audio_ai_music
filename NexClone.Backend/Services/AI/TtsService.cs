using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace NexClone.Backend.Services.AI
{
    public class TtsService : ITtsService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IHttpClientFactory _httpClientFactory;

        public TtsService(ApplicationDbContext dbContext, IHttpClientFactory httpClientFactory)
        {
            _dbContext = dbContext;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<(Stream AudioStream, string ContentType, string FileExtension)> GenerateAudioAsync(
            string text, 
            string language, 
            string voiceName, 
            string styleInstruction)
        {
            if (string.IsNullOrWhiteSpace(text))
                throw new ArgumentException("Text cannot be empty.");

            var toolConfig = await _dbContext.ToolConfigurations.FirstOrDefaultAsync(t => t.ToolName == "text-to-voice" && t.IsActive);
            
            // Default logic if no ToolConfiguration is set
            string providerName = "OpenAI"; 
            if (toolConfig == null)
            {
                if (language?.ToLower() == "arabic")
                {
                    bool hasGemini = await _dbContext.ApiConfigurations.AnyAsync(c => c.ProviderName == "Gemini" && c.IsActive);
                    providerName = hasGemini ? "Gemini" : "Darijat";
                }
            }
            else
            {
                providerName = toolConfig.ProviderName;
            }

            var apiConfig = await _dbContext.ApiConfigurations.FirstOrDefaultAsync(c => c.ProviderName == providerName && c.IsActive);
            if (apiConfig == null)
                throw new Exception($"No active configuration found for provider '{providerName}'.");

            string customModelName = toolConfig?.ModelName;

            if (providerName.Equals("Gemini", StringComparison.OrdinalIgnoreCase))
            {
                return await GenerateGeminiAudioAsync(text, voiceName, styleInstruction, apiConfig, customModelName);
            }
            else if (providerName.Equals("Darijat", StringComparison.OrdinalIgnoreCase))
            {
                return await GenerateDarijatAudioAsync(text, voiceName, styleInstruction, apiConfig);
            }
            else
            {
                // Default to OpenAI
                return await GenerateOpenAiAudioAsync(text, voiceName, apiConfig, customModelName);
            }
        }

        private async Task<(Stream, string, string)> GenerateOpenAiAudioAsync(string text, string voiceName, ApiConfiguration config, string customModelName = null)
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.ApiKey}");

            var payload = new
            {
                model = string.IsNullOrWhiteSpace(customModelName) ? "tts-1" : customModelName,
                input = text,
                voice = string.IsNullOrWhiteSpace(voiceName) ? "alloy" : voiceName,
                response_format = "mp3"
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("https://api.openai.com/v1/audio/speech", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"OpenAI API Error: {error}");
            }

            var stream = await response.Content.ReadAsStreamAsync();
            return (stream, "audio/mpeg", "mp3");
        }

        private async Task<(Stream, string, string)> GenerateDarijatAudioAsync(string text, string voiceName, string styleInstruction, ApiConfiguration config)
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config.ApiKey}");
            client.DefaultRequestHeaders.Add("Accept", "application/json");

            var payload = new
            {
                text = text,
                voice_name = voiceName,
                human_simulation = true,
                style_instruction = styleInstruction
            };

            var url = config.BaseUrl ?? "https://tts.darijat.com/api/v1/external/generate-audio";
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            
            var response = await client.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Darijat API Error: {error}");
            }

            // Darijat can return direct audio or JSON with audio_url
            var contentType = response.Content.Headers.ContentType?.MediaType;

            if (contentType != null && contentType.Contains("application/json"))
            {
                var jsonResponse = await response.Content.ReadAsStringAsync();
                using var jsonDoc = JsonDocument.Parse(jsonResponse);
                
                string? audioUrl = null;
                if (jsonDoc.RootElement.TryGetProperty("audio_url", out var urlElement))
                    audioUrl = urlElement.GetString();
                else if (jsonDoc.RootElement.TryGetProperty("url", out var urlProp))
                    audioUrl = urlProp.GetString();

                if (string.IsNullOrEmpty(audioUrl))
                    throw new Exception("Darijat API returned JSON without audio URL.");

                var audioResponse = await client.GetAsync(audioUrl);
                audioResponse.EnsureSuccessStatusCode();
                var stream = await audioResponse.Content.ReadAsStreamAsync();
                return (stream, "audio/mpeg", "mp3");
            }
            else
            {
                var stream = await response.Content.ReadAsStreamAsync();
                return (stream, "audio/mpeg", "mp3");
            }
        }

        private async Task<(Stream, string, string)> GenerateGeminiAudioAsync(string text, string voiceName, string styleInstruction, ApiConfiguration config, string customModelName = null)
        {
            // Resolve Gemini voice from Darijat mapping
            string geminiVoice = "Zephyr";
            var voiceModel = await _dbContext.Voices.FirstOrDefaultAsync(v => v.VoiceName == voiceName);
            if (voiceModel != null && !string.IsNullOrEmpty(voiceModel.GeminiVoice))
            {
                geminiVoice = voiceModel.GeminiVoice;
            }

            var prompt = string.IsNullOrWhiteSpace(styleInstruction) ? 
                $"Read the following text aloud:\n\n{text}" : 
                $"Read the following text aloud in this style: {styleInstruction}\n\n{text}";

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("x-goog-api-key", config.ApiKey);

            var modelName = string.IsNullOrWhiteSpace(customModelName) ? "gemini-2.5-flash-preview-tts" : customModelName; 
            if (string.IsNullOrWhiteSpace(customModelName) && !string.IsNullOrEmpty(config.AdditionalSettings))
            {
                try
                {
                    using var doc = JsonDocument.Parse(config.AdditionalSettings);
                    if (doc.RootElement.TryGetProperty("gemini_model", out var mElement))
                        modelName = mElement.GetString() ?? modelName;
                }
                catch { }
            }

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent";
            
            var payload = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig = new
                {
                    responseModalities = new[] { "AUDIO" },
                    speechConfig = new
                    {
                        voiceConfig = new
                        {
                            prebuiltVoiceConfig = new { voiceName = geminiVoice }
                        }
                    }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Gemini API Error: {error}");
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();
            using var jsonDoc = JsonDocument.Parse(jsonResponse);
            
            try
            {
                var inlineData = jsonDoc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("inlineData");
                
                var base64Audio = inlineData.GetProperty("data").GetString();
                if (string.IsNullOrEmpty(base64Audio))
                    throw new Exception("Gemini API returned empty audio data.");

                var audioBytes = Convert.FromBase64String(base64Audio);
                
                // Add minimal WAV header for PCM data if needed, or just return bytes
                // For simplicity, returning raw bytes wrapped in MemoryStream
                // Production code should wrap PCM in WAV header like the old Python code did.
                var mimeType = inlineData.GetProperty("mimeType").GetString() ?? "";
                
                if (mimeType.ToLowerInvariant().Contains("audio/l16") || mimeType.ToLowerInvariant().Contains("pcm"))
                {
                    var wavBytes = PcmToWav(audioBytes, 24000, 1, 16);
                    return (new MemoryStream(wavBytes), "audio/wav", "wav");
                }
                
                return (new MemoryStream(audioBytes), "audio/mpeg", "mp3");
            }
            catch (Exception ex)
            {
                throw new Exception($"Error parsing Gemini response: {ex.Message}");
            }
        }

        private static byte[] PcmToWav(byte[] pcmData, int sampleRate, int channels, int bitsPerSample)
        {
            using var ms = new MemoryStream();
            using var writer = new BinaryWriter(ms);
            
            int dataSize = pcmData.Length;
            int byteRate = sampleRate * channels * (bitsPerSample / 8);
            short blockAlign = (short)(channels * (bitsPerSample / 8));

            writer.Write(Encoding.ASCII.GetBytes("RIFF"));
            writer.Write(36 + dataSize);
            writer.Write(Encoding.ASCII.GetBytes("WAVE"));
            writer.Write(Encoding.ASCII.GetBytes("fmt "));
            writer.Write(16); // Subchunk1Size
            writer.Write((short)1); // AudioFormat (PCM)
            writer.Write((short)channels);
            writer.Write(sampleRate);
            writer.Write(byteRate);
            writer.Write(blockAlign);
            writer.Write((short)bitsPerSample);
            writer.Write(Encoding.ASCII.GetBytes("data"));
            writer.Write(dataSize);
            writer.Write(pcmData);

            return ms.ToArray();
        }
    }
}
