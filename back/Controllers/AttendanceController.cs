using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Eftekad.Backend.Data;
using Eftekad.Backend.Models;
using System.Text.Json;
using System.Collections.Generic;
using System.Linq;

namespace Eftekad.Backend.Controllers
{
    [ApiController]
    [Route("api/attendance")]
    public class AttendanceController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public AttendanceController(EftekadDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAttendance([FromQuery] string? year, [FromQuery] string? serviceName, [FromQuery] string? className, [FromQuery] string? date)
        {
            try
            {
                var query = _context.Attendances.AsQueryable();

                if (!string.IsNullOrEmpty(year)) query = query.Where(a => a.ServiceYear == year);
                if (!string.IsNullOrEmpty(serviceName)) query = query.Where(a => a.ServiceName == serviceName);
                if (!string.IsNullOrEmpty(className)) query = query.Where(a => a.ClassName == className);
                if (!string.IsNullOrEmpty(date)) query = query.Where(a => a.Date == date);

                var list = await query.ToListAsync();
                var result = new List<object>();

                foreach (var a in list)
                {
                    object records = new object();
                    try { records = JsonSerializer.Deserialize<object>(a.RecordsJson) ?? new object(); } catch {}

                    result.Add(new
                    {
                        id = a.Id,
                        serviceName = a.ServiceName,
                        className = a.ClassName,
                        stageName = a.StageName,
                        date = a.Date,
                        records = records,
                        serviceYear = a.ServiceYear,
                        createdAt = a.CreatedAt,
                        updatedAt = a.UpdatedAt
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class SaveAttendancePayload
        {
            public string ServiceName { get; set; } = string.Empty;
            public string ClassName { get; set; } = string.Empty;
            public string? StageName { get; set; }
            public string Date { get; set; } = string.Empty;
            public JsonElement Records { get; set; }
            public string? ServiceYear { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> SaveAttendance([FromBody] SaveAttendancePayload payload)
        {
            try
            {
                if (string.IsNullOrEmpty(payload.ServiceName) || string.IsNullOrEmpty(payload.ClassName) || string.IsNullOrEmpty(payload.Date))
                {
                    return BadRequest(new { error = "الخدمة والفصل والتاريخ مطلوبون" });
                }

                var attendance = await _context.Attendances.FirstOrDefaultAsync(a =>
                    a.ServiceName == payload.ServiceName &&
                    a.ClassName == payload.ClassName &&
                    a.Date == payload.Date);

                if (attendance != null)
                {
                    attendance.RecordsJson = JsonSerializer.Serialize(payload.Records);
                    attendance.StageName = payload.StageName ?? attendance.StageName;
                    attendance.ServiceYear = payload.ServiceYear ?? attendance.ServiceYear;
                    attendance.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    attendance = new Attendance
                    {
                        Id = $"att_{DateTime.UtcNow.Ticks}",
                        ServiceName = payload.ServiceName,
                        ClassName = payload.ClassName,
                        StageName = payload.StageName ?? string.Empty,
                        Date = payload.Date,
                        RecordsJson = JsonSerializer.Serialize(payload.Records),
                        ServiceYear = payload.ServiceYear ?? "2026"
                    };
                    _context.Attendances.Add(attendance);
                }

                await _context.SaveChangesAsync();

                object finalRecords = new object();
                try { finalRecords = JsonSerializer.Deserialize<object>(attendance.RecordsJson) ?? new object(); } catch {}

                return Ok(new
                {
                    success = true,
                    attendance = new
                    {
                        id = attendance.Id,
                        serviceName = attendance.ServiceName,
                        className = attendance.ClassName,
                        stageName = attendance.StageName,
                        date = attendance.Date,
                        records = finalRecords,
                        serviceYear = attendance.ServiceYear,
                        createdAt = attendance.CreatedAt,
                        updatedAt = attendance.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
