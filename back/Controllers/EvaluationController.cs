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
    [Route("api")]
    public class EvaluationController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public EvaluationController(EftekadDbContext context)
        {
            _context = context;
        }

        // ==================== SERVANT EVALUATION RECORDS ====================

        [HttpGet("evaluations")]
        public async Task<IActionResult> GetEvaluations()
        {
            try
            {
                var list = await _context.ServantEvaluations.ToListAsync();
                var result = new List<object>();

                foreach (var ev in list)
                {
                    object val = false;
                    try { val = JsonSerializer.Deserialize<object>(ev.ValueJson) ?? false; } catch {}

                    result.Add(new
                    {
                        id = ev.Id,
                        templateId = ev.TemplateId,
                        servantUsername = ev.ServantUsername,
                        weekDate = ev.WeekDate,
                        value = val,
                        scannedAt = ev.ScannedAt,
                        serviceYear = ev.ServiceYear,
                        createdAt = ev.CreatedAt,
                        updatedAt = ev.UpdatedAt
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class SaveEvaluationPayload
        {
            public string TemplateId { get; set; } = string.Empty;
            public string ServantUsername { get; set; } = string.Empty;
            public string WeekDate { get; set; } = string.Empty;
            public JsonElement Value { get; set; }
            public string? ServiceYear { get; set; }
        }

        [HttpPost("evaluations")]
        [HttpPost("servant-evaluations")]
        public async Task<IActionResult> SaveEvaluation([FromBody] SaveEvaluationPayload payload)
        {
            try
            {
                var ev = await _context.ServantEvaluations.FirstOrDefaultAsync(e =>
                    e.TemplateId == payload.TemplateId &&
                    e.ServantUsername == payload.ServantUsername &&
                    e.WeekDate == payload.WeekDate);

                if (ev != null)
                {
                    ev.ValueJson = JsonSerializer.Serialize(payload.Value);
                    ev.ScannedAt = DateTime.UtcNow.ToString("o");
                    ev.ServiceYear = payload.ServiceYear ?? ev.ServiceYear;
                    ev.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    ev = new ServantEvaluation
                    {
                        Id = $"eval_rec_{DateTime.UtcNow.Ticks}",
                        TemplateId = payload.TemplateId,
                        ServantUsername = payload.ServantUsername,
                        WeekDate = payload.WeekDate,
                        ValueJson = JsonSerializer.Serialize(payload.Value),
                        ScannedAt = DateTime.UtcNow.ToString("o"),
                        ServiceYear = payload.ServiceYear ?? "2026"
                    };
                    _context.ServantEvaluations.Add(ev);
                }

                await _context.SaveChangesAsync();

                object finalVal = false;
                try { finalVal = JsonSerializer.Deserialize<object>(ev.ValueJson) ?? false; } catch {}

                return Ok(new
                {
                    success = true,
                    evaluation = new
                    {
                        id = ev.Id,
                        templateId = ev.TemplateId,
                        servantUsername = ev.ServantUsername,
                        weekDate = ev.WeekDate,
                        value = finalVal,
                        scannedAt = ev.ScannedAt,
                        serviceYear = ev.ServiceYear,
                        createdAt = ev.CreatedAt,
                        updatedAt = ev.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("servant-evaluations")]
        public async Task<IActionResult> GetServantEvaluations([FromQuery] string? servantUsername, [FromQuery] string? weekDate, [FromQuery] string? serviceYear)
        {
            try
            {
                var query = _context.ServantEvaluations.AsQueryable();

                if (!string.IsNullOrEmpty(servantUsername)) query = query.Where(e => e.ServantUsername == servantUsername);
                if (!string.IsNullOrEmpty(weekDate)) query = query.Where(e => e.WeekDate == weekDate);
                if (!string.IsNullOrEmpty(serviceYear)) query = query.Where(e => e.ServiceYear == serviceYear);

                var list = await query.ToListAsync();
                var result = new List<object>();

                foreach (var ev in list)
                {
                    object val = false;
                    try { val = JsonSerializer.Deserialize<object>(ev.ValueJson) ?? false; } catch {}

                    result.Add(new
                    {
                        id = ev.Id,
                        templateId = ev.TemplateId,
                        servantUsername = ev.ServantUsername,
                        weekDate = ev.WeekDate,
                        value = val,
                        scannedAt = ev.ScannedAt,
                        serviceYear = ev.ServiceYear,
                        createdAt = ev.CreatedAt,
                        updatedAt = ev.UpdatedAt
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class QrScanPayload
        {
            public string QrData { get; set; } = string.Empty;
            public string TemplateId { get; set; } = string.Empty;
            public string? WeekDate { get; set; }
            public string? ServiceYear { get; set; }
        }

        [HttpPost("servant-evaluations/scan")]
        public async Task<IActionResult> ScanServantEvaluation([FromBody] QrScanPayload payload)
        {
            try
            {
                var servantUsername = payload.QrData.Trim();
                if (string.IsNullOrEmpty(servantUsername) || string.IsNullOrEmpty(payload.TemplateId))
                {
                    return BadRequest(new { error = "بيانات المسح غير مكتملة" });
                }

                var weekDate = !string.IsNullOrEmpty(payload.WeekDate) ? payload.WeekDate : DateTime.UtcNow.ToString("yyyy-MM-dd");

                var ev = await _context.ServantEvaluations.FirstOrDefaultAsync(e =>
                    e.TemplateId == payload.TemplateId &&
                    e.ServantUsername == servantUsername &&
                    e.WeekDate == weekDate);

                if (ev != null)
                {
                    ev.ValueJson = "true";
                    ev.ScannedAt = DateTime.UtcNow.ToString("o");
                    ev.ServiceYear = payload.ServiceYear ?? ev.ServiceYear;
                    ev.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    ev = new ServantEvaluation
                    {
                        Id = $"eval_rec_{DateTime.UtcNow.Ticks}",
                        TemplateId = payload.TemplateId,
                        ServantUsername = servantUsername,
                        WeekDate = weekDate,
                        ValueJson = "true",
                        ScannedAt = DateTime.UtcNow.ToString("o"),
                        ServiceYear = payload.ServiceYear ?? "2026"
                    };
                    _context.ServantEvaluations.Add(ev);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    servantUsername = servantUsername,
                    evaluation = new
                    {
                        id = ev.Id,
                        templateId = ev.TemplateId,
                        servantUsername = ev.ServantUsername,
                        weekDate = ev.WeekDate,
                        value = true,
                        scannedAt = ev.ScannedAt,
                        serviceYear = ev.ServiceYear,
                        createdAt = ev.CreatedAt,
                        updatedAt = ev.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ==================== EVALUATION TEMPLATES ====================

        [HttpGet("evaluation-templates")]
        public async Task<IActionResult> GetEvaluationTemplates()
        {
            try
            {
                var list = await _context.EvaluationTemplates.ToListAsync();
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("evaluation-templates")]
        public async Task<IActionResult> CreateEvaluationTemplate([FromBody] EvaluationTemplate template)
        {
            try
            {
                if (string.IsNullOrEmpty(template.Name))
                {
                    return BadRequest(new { error = "اسم البند مطلوب" });
                }

                template.Id = string.IsNullOrEmpty(template.Id) ? $"eval_{DateTime.UtcNow.Ticks}" : template.Id;
                template.Active = true;

                _context.EvaluationTemplates.Add(template);
                await _context.SaveChangesAsync();

                return Created($"/api/evaluation-templates/{template.Id}", template);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("evaluation-templates/{id}")]
        public async Task<IActionResult> UpdateEvaluationTemplate(string id, [FromBody] JsonElement payload)
        {
            try
            {
                var template = await _context.EvaluationTemplates.FirstOrDefaultAsync(t => t.Id == id);
                if (template == null)
                {
                    return NotFound(new { error = "البند غير موجود" });
                }

                if (payload.TryGetProperty("name", out var nameProp)) template.Name = nameProp.GetString() ?? template.Name;
                if (payload.TryGetProperty("type", out var typeProp)) template.Type = typeProp.GetString() ?? template.Type;
                if (payload.TryGetProperty("serviceName", out var serviceProp)) template.ServiceName = serviceProp.GetString() ?? template.ServiceName;
                if (payload.TryGetProperty("className", out var classProp)) template.ClassName = classProp.GetString() ?? template.ClassName;
                if (payload.TryGetProperty("stageName", out var stageProp)) template.StageName = stageProp.GetString() ?? template.StageName;
                if (payload.TryGetProperty("targetDay", out var dayProp)) template.TargetDay = dayProp.GetString() ?? template.TargetDay;
                if (payload.TryGetProperty("serviceYear", out var yearProp)) template.ServiceYear = yearProp.GetString() ?? template.ServiceYear;
                if (payload.TryGetProperty("active", out var activeProp)) template.Active = activeProp.GetBoolean();

                template.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(template);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("evaluation-templates/{id}")]
        public async Task<IActionResult> DeleteEvaluationTemplate(string id)
        {
            try
            {
                var template = await _context.EvaluationTemplates.FirstOrDefaultAsync(t => t.Id == id);
                if (template != null)
                {
                    _context.EvaluationTemplates.Remove(template);
                    await _context.SaveChangesAsync();
                }
                return Ok(new { success = true, message = "تم حذف البند بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
