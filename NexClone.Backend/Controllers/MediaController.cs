using Microsoft.AspNetCore.Mvc;
using NexClone.Backend.Services;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace NexClone.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MediaController : ControllerBase
    {
        private readonly IMediaService _mediaService;

        public MediaController(IMediaService mediaService)
        {
            _mediaService = mediaService;
        }

        public class PresignedUrlRequest
        {
            public string FileName { get; set; }
            public string ContentType { get; set; }
            public string ToolName { get; set; }
        }

        [Authorize]
        [HttpPost("upload-url")]
        public async Task<IActionResult> GetPresignedUploadUrl([FromBody] PresignedUrlRequest request)
        {
            if (string.IsNullOrEmpty(request.FileName) || string.IsNullOrEmpty(request.ContentType))
            {
                return BadRequest("FileName and ContentType are required.");
            }

            var userIdStr = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var toolName = string.IsNullOrEmpty(request.ToolName) ? "uploads" : request.ToolName; 
            var month = DateTime.UtcNow.ToString("yyyy-MM");
            var uniqueFileName = $"{Guid.NewGuid()}_{request.FileName}";

            var objectName = $"private/{userIdStr}/{toolName}/{month}/{uniqueFileName}";
            var url = await _mediaService.GeneratePresignedUploadUrlAsync(objectName, request.ContentType);
            
            return Ok(new { url, objectName });
        }
    }
}
