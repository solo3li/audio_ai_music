using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexClone.Backend.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace NexClone.Backend.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Route("api/admin/apiconfig")]
    [ApiController]
    [Authorize] // You can add Roles = "Admin" if you have role-based auth
    public class ApiConfigController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;

        public ApiConfigController(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllConfigs()
        {
            var configs = await _dbContext.ApiConfigurations.ToListAsync();
            return Ok(configs);
        }

        [HttpPost]
        public async Task<IActionResult> CreateConfig([FromBody] ApiConfiguration config)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            config.Id = Guid.NewGuid();
            config.UpdatedAt = DateTime.UtcNow;
            
            _dbContext.ApiConfigurations.Add(config);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAllConfigs), new { id = config.Id }, config);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateConfig(Guid id, [FromBody] ApiConfiguration updateConfig)
        {
            var config = await _dbContext.ApiConfigurations.FindAsync(id);
            if (config == null) return NotFound();

            config.ProviderName = updateConfig.ProviderName;
            config.ApiKey = updateConfig.ApiKey;
            config.BaseUrl = updateConfig.BaseUrl;
            config.IsActive = updateConfig.IsActive;
            config.AdditionalSettings = updateConfig.AdditionalSettings;
            config.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            return Ok(config);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteConfig(Guid id)
        {
            var config = await _dbContext.ApiConfigurations.FindAsync(id);
            if (config == null) return NotFound();

            _dbContext.ApiConfigurations.Remove(config);
            await _dbContext.SaveChangesAsync();

            return NoContent();
        }
    }
}
