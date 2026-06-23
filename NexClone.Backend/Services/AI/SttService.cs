using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace NexClone.Backend.Services.AI
{
    public class SttService : ISttService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IHttpClientFactory _httpClientFactory;

        // Languages mapping from the old python code
        private readonly Dictionary<string, string> _languageNames = new Dictionary<string, string>
        {
            {"en", "English"}, {"fr", "French"}, {"es", "Spanish"}, {"de", "German"},
            {"it", "Italian"}, {"pt", "Portuguese"}, {"ru", "Russian"}, {"zh", "Chinese"},
            {"ja", "Japanese"}, {"ko", "Korean"}, {"ar", "Arabic"}, {"hi", "Hindi"},
            {"tr", "Turkish"}, {"nl", "Dutch"}, {"sv", "Swedish"}, {"da", "Danish"},
            {"no", "Norwegian"}, {"fi", "Finnish"}, {"el", "Greek"}, {"pl", "Polish"}
        };

        public SttService(ApplicationDbContext dbContext, IHttpClientFactory httpClientFactory)
        {
            _dbContext = dbContext;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<SttResult> TranscribeAudioAsync(byte[] audioData, string fileName, string contentType, bool translate, string targetLanguage)
        {
            var openAiConfig = await _dbContext.ApiConfigurations
                .FirstOrDefaultAsync(c => c.ProviderName == "OpenAI" && c.IsActive);

            if (openAiConfig == null || string.IsNullOrWhiteSpace(openAiConfig.ApiKey))
            {
                return new SttResult { Success = false, ErrorMessage = "No active configuration found for OpenAI." };
            }

            try
            {
                string originalText = await CallWhisperApiAsync(audioData, fileName, contentType, openAiConfig.ApiKey);
                
                var result = new SttResult
                {
                    Success = true,
                    OriginalText = originalText
                };

                if (translate)
                {
                    string targetLangName = _languageNames.ContainsKey(targetLanguage) ? _languageNames[targetLanguage] : targetLanguage;
                    string translatedText = await CallTranslateApiAsync(originalText, targetLangName, openAiConfig.ApiKey);
                    
                    result.TranslatedText = translatedText;
                    result.TargetLanguage = targetLanguage;
                }

                return result;
            }
            catch (Exception ex)
            {
                return new SttResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        private async Task<string> CallWhisperApiAsync(byte[] audioData, string fileName, string contentType, string apiKey)
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            using var content = new MultipartFormDataContent();
            
            // Add file
            var streamContent = new ByteArrayContent(audioData);
            streamContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            content.Add(streamContent, "file", fileName);
            
            // Add model
            content.Add(new StringContent("whisper-1"), "model");
            // Add response format
            content.Add(new StringContent("text"), "response_format");
            // Add prompt
            content.Add(new StringContent("Transcribe exactly what is said without translation. Preserve the original language, dialect, and exact words spoken."), "prompt");

            var response = await client.PostAsync("https://api.openai.com/v1/audio/transcriptions", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"OpenAI Whisper API Error: {error}");
            }

            // when response_format is "text", the response body is just raw text, not JSON
            return await response.Content.ReadAsStringAsync();
        }

        private async Task<string> CallTranslateApiAsync(string text, string targetLangName, string apiKey)
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                model = "gpt-4o-mini",
                messages = new[]
                {
                    new { role = "system", content = $"You are a professional translator. Translate the following text to {targetLangName}. Maintain the original meaning and tone." },
                    new { role = "user", content = text }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("https://api.openai.com/v1/chat/completions", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"OpenAI Translation API Error: {error}");
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();
            using var jsonDoc = JsonDocument.Parse(jsonResponse);
            
            try
            {
                var translatedText = jsonDoc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();
                
                return translatedText ?? string.Empty;
            }
            catch
            {
                throw new Exception("Failed to parse OpenAI translation response.");
            }
        }
    }
}
