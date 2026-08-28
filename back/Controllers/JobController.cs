using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Eftekad.Backend.Data;
using Eftekad.Backend.Models;
using System.Linq;

namespace Eftekad.Backend.Controllers
{
    [ApiController]
    [Route("api/jobs")]
    public class JobController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public JobController(EftekadDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetJobs()
        {
            try
            {
                var list = await _context.Jobs.OrderBy(j => j.Order).ToListAsync();
                return Ok(new { success = true, jobs = list });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateJob([FromBody] Job data)
        {
            try
            {
                var val = !string.IsNullOrEmpty(data.Title) ? data.Title : (!string.IsNullOrEmpty(data.Name) ? data.Name : "وظيفة جديدة");
                data.Title = val;
                data.Name = val;
                data.Id = string.IsNullOrEmpty(data.Id) ? $"job_{DateTime.UtcNow.Ticks}" : data.Id;

                _context.Jobs.Add(data);
                await _context.SaveChangesAsync();

                return Created($"/api/jobs/{data.Id}", new { success = true, job = data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJob(string id, [FromBody] Job data)
        {
            try
            {
                var job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == id);
                if (job == null)
                {
                    return NotFound(new { error = "الوظيفة غير موجودة" });
                }

                var val = !string.IsNullOrEmpty(data.Title) ? data.Title : data.Name;
                if (!string.IsNullOrEmpty(val))
                {
                    job.Title = val;
                    job.Name = val;
                }

                if (data.Order != 0) job.Order = data.Order;
                if (!string.IsNullOrEmpty(data.ServiceYear)) job.ServiceYear = data.ServiceYear;

                job.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, job });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJob(string id)
        {
            try
            {
                var job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == id);
                if (job != null)
                {
                    _context.Jobs.Remove(job);
                    await _context.SaveChangesAsync();
                }
                return Ok(new { success = true, message = "تم حذف الوظيفة بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
