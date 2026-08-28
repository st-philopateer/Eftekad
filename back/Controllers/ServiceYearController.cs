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
    [Route("api/service-years")]
    public class ServiceYearController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public ServiceYearController(EftekadDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetServiceYears()
        {
            try
            {
                var list = await _context.ServiceYears.ToListAsync();
                return Ok(new { success = true, serviceYears = list });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class CreatePayload
        {
            public string Year { get; set; } = string.Empty;
            public bool IsActive { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> CreateServiceYear([FromBody] CreatePayload payload)
        {
            try
            {
                if (string.IsNullOrEmpty(payload.Year))
                {
                    return BadRequest(new { error = "السنة مطلوبة" });
                }

                var existing = await _context.ServiceYears.FirstOrDefaultAsync(y => y.Year == payload.Year);
                if (existing != null)
                {
                    return BadRequest(new { error = "سنة الخدمة موجودة بالفعل" });
                }

                var newYear = new ServiceYear
                {
                    Year = payload.Year.ToString(),
                    IsActive = payload.IsActive
                };

                _context.ServiceYears.Add(newYear);
                await _context.SaveChangesAsync();

                return Created($"/api/service-years/{newYear.Year}", newYear);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{oldYear}")]
        public async Task<IActionResult> UpdateServiceYear(string oldYear, [FromBody] CreatePayload payload)
        {
            try
            {
                var year = await _context.ServiceYears.FirstOrDefaultAsync(y => y.Year == oldYear);
                if (year == null)
                {
                    return NotFound(new { error = "سنة الخدمة غير موجودة" });
                }

                // If renaming the key, we must delete and recreate since it is the Key
                var newYearName = !string.IsNullOrEmpty(payload.Year) ? payload.Year : oldYear;

                if (newYearName != oldYear)
                {
                    _context.ServiceYears.Remove(year);
                    await _context.SaveChangesAsync();

                    var newYear = new ServiceYear
                    {
                        Year = newYearName,
                        IsActive = payload.IsActive,
                        CreatedAt = year.CreatedAt,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.ServiceYears.Add(newYear);
                }
                else
                {
                    year.IsActive = payload.IsActive;
                    year.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                var finalYear = await _context.ServiceYears.FirstOrDefaultAsync(y => y.Year == newYearName);
                return Ok(finalYear);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{year}")]
        public async Task<IActionResult> DeleteServiceYear(string year)
        {
            try
            {
                var sYear = await _context.ServiceYears.FirstOrDefaultAsync(y => y.Year == year);
                if (sYear != null)
                {
                    _context.ServiceYears.Remove(sYear);
                    await _context.SaveChangesAsync();
                }
                return Ok(new { success = true, message = "تم حذف سنة الخدمة بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
