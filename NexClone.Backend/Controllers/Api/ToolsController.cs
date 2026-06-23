using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NexClone.Backend.Services.AI;
using System.Threading.Tasks;

namespace NexClone.Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ToolsController : ControllerBase
    {
        private readonly ISttService _sttService;

        public ToolsController(ISttService sttService)
        {
            _sttService = sttService;
        }

        [HttpPost("voice-to-text")]
        public async Task<IActionResult> VoiceToText([FromForm] IFormFile file, [FromForm] string mode, [FromForm] string language)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { error = "No file provided" });
            }

            bool translate = mode == "translate";
            string targetLang = translate ? "en" : (string.IsNullOrWhiteSpace(language) ? "en" : language);

            using var ms = new System.IO.MemoryStream();
            await file.CopyToAsync(ms);
            var audioData = ms.ToArray();

            var result = await _sttService.TranscribeAudioAsync(audioData, file.FileName, file.ContentType, translate, targetLang);

            if (!result.Success)
            {
                return StatusCode(500, new { error = result.ErrorMessage });
            }

            string responseText = translate ? result.TranslatedText : result.OriginalText;

            return Ok(new { text = responseText });
        }
    }
}
