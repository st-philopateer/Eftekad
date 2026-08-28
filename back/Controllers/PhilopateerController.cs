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
    [Route("api/philopateer")]
    public class PhilopateerController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public PhilopateerController(EftekadDbContext context)
        {
            _context = context;
        }

        // ==================== RULES ====================

        [HttpGet("rules")]
        public async Task<IActionResult> GetRules()
        {
            try
            {
                var rules = await _context.PhilopateerRules.ToListAsync();
                var defaults = new List<PhilopateerRule>
                {
                    new PhilopateerRule { Id = "rule_1", ServiceType = "poster", MinDaysRequired = 3, Description = "انشاء البوسترات" },
                    new PhilopateerRule { Id = "rule_2", ServiceType = "video", MinDaysRequired = 5, Description = "انشاء فيديو" },
                    new PhilopateerRule { Id = "rule_3", ServiceType = "montage", MinDaysRequired = 4, Description = "مونتاج" },
                    new PhilopateerRule { Id = "rule_4", ServiceType = "office", MinDaysRequired = 2, Description = "اوفيس" },
                    new PhilopateerRule { Id = "rule_5", ServiceType = "photography", MinDaysRequired = 3, Description = "تصوير" },
                    new PhilopateerRule { Id = "rule_6", ServiceType = "sound", MinDaysRequired = 3, Description = "خدمات الصوت والساوند" },
                    new PhilopateerRule { Id = "rule_7", ServiceType = "terms", MinDaysRequired = 0, Description = "الشروط والأحكام الخاصة بخدمة سان فيلوباتير" }
                };

                bool needsSeed = false;
                foreach (var def in defaults)
                {
                    if (!rules.Any(r => r.ServiceType == def.ServiceType))
                    {
                        _context.PhilopateerRules.Add(def);
                        needsSeed = true;
                    }
                }

                if (needsSeed)
                {
                    await _context.SaveChangesAsync();
                    rules = await _context.PhilopateerRules.ToListAsync();
                }

                return Ok(new { success = true, rules });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class SaveRulePayload
        {
            public string ServiceType { get; set; } = string.Empty;
            public int MinDaysRequired { get; set; } = 3;
            public string Description { get; set; } = string.Empty;
        }

        [HttpPost("rules")]
        public async Task<IActionResult> SaveRule([FromBody] SaveRulePayload payload)
        {
            try
            {
                if (string.IsNullOrEmpty(payload.ServiceType))
                {
                    return BadRequest(new { error = "نوع الخدمة مطلوب" });
                }

                var rule = await _context.PhilopateerRules.FirstOrDefaultAsync(r => r.ServiceType == payload.ServiceType);
                if (rule != null)
                {
                    rule.MinDaysRequired = payload.MinDaysRequired;
                    rule.Description = payload.Description;
                    rule.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    rule = new PhilopateerRule
                    {
                        Id = $"rule_{DateTime.UtcNow.Ticks}",
                        ServiceType = payload.ServiceType,
                        MinDaysRequired = payload.MinDaysRequired,
                        Description = payload.Description
                    };
                    _context.PhilopateerRules.Add(rule);
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, rule });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ==================== REQUESTS ====================

        [HttpGet("requests")]
        public async Task<IActionResult> GetRequests([FromQuery] string? requesterUsername)
        {
            try
            {
                var query = _context.PhilopateerRequests.AsQueryable();

                if (!string.IsNullOrEmpty(requesterUsername))
                {
                    var cleanUser = requesterUsername.Trim().ToLower();
                    query = query.Where(r => r.RequesterUsername.ToLower() == cleanUser);
                }

                var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
                var result = new List<object>();

                foreach (var r in list)
                {
                    object files = new string[0];
                    try { files = JsonSerializer.Deserialize<object>(r.FilesJson) ?? new string[0]; } catch {}

                    object photographyDetails = new object();
                    try { photographyDetails = JsonSerializer.Deserialize<object>(r.PhotographyDetailsJson) ?? new object(); } catch {}

                    result.Add(new
                    {
                        id = r.Id,
                        _id = r.Id, // Node compatibility
                        requestType = r.RequestType,
                        requesterUsername = r.RequesterUsername,
                        requesterName = r.RequesterName,
                        requesterOsra = r.RequesterOsra,
                        details = r.Details,
                        requiredDate = r.RequiredDate,
                        files = files,
                        photographyDetails = photographyDetails,
                        status = r.Status,
                        seen = r.Seen,
                        createdAt = r.CreatedAt,
                        updatedAt = r.UpdatedAt
                    });
                }

                return Ok(new { success = true, requests = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("requests")]
        public async Task<IActionResult> CreateRequest([FromBody] JsonElement payload)
        {
            try
            {
                if (!payload.TryGetProperty("requestType", out var typeProp) ||
                    !payload.TryGetProperty("requesterUsername", out var userProp) ||
                    !payload.TryGetProperty("requiredDate", out var dateProp))
                {
                    return BadRequest(new { error = "بيانات الطلب غير مكتملة" });
                }

                var username = (userProp.GetString() ?? string.Empty).Trim().ToLower();

                var request = new PhilopateerRequest
                {
                    Id = payload.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? $"req_{DateTime.UtcNow.Ticks}" : $"req_{DateTime.UtcNow.Ticks}",
                    RequestType = typeProp.GetString() ?? string.Empty,
                    RequesterUsername = username,
                    RequesterName = payload.TryGetProperty("requesterName", out var nameProp) ? nameProp.GetString() ?? string.Empty : string.Empty,
                    RequesterOsra = payload.TryGetProperty("requesterOsra", out var osraProp) ? osraProp.GetString() ?? string.Empty : string.Empty,
                    Details = payload.TryGetProperty("details", out var detProp) ? detProp.GetString() ?? string.Empty : string.Empty,
                    RequiredDate = dateProp.GetString() ?? string.Empty,
                    Status = payload.TryGetProperty("status", out var statusProp) ? statusProp.GetString() ?? "pending" : "pending",
                    Seen = payload.TryGetProperty("seen", out var seenProp) && seenProp.GetBoolean()
                };

                if (payload.TryGetProperty("files", out var filesProp))
                {
                    request.FilesJson = JsonSerializer.Serialize(filesProp);
                }
                if (payload.TryGetProperty("photographyDetails", out var photoProp))
                {
                    request.PhotographyDetailsJson = JsonSerializer.Serialize(photoProp);
                }

                _context.PhilopateerRequests.Add(request);
                await _context.SaveChangesAsync();

                return Created($"/api/philopateer/requests/{request.Id}", new { success = true, request });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class UpdateStatusPayload
        {
            public string Status { get; set; } = string.Empty;
        }

        [HttpPost("requests/{requestId}/status")]
        public async Task<IActionResult> UpdateRequestStatus(string requestId, [FromBody] UpdateStatusPayload payload)
        {
            try
            {
                if (string.IsNullOrEmpty(payload.Status))
                {
                    return BadRequest(new { error = "الحالة مطلوبة" });
                }

                var request = await _context.PhilopateerRequests.FirstOrDefaultAsync(r => r.Id == requestId);
                if (request == null)
                {
                    return NotFound(new { error = "الطلب غير موجود" });
                }

                request.Status = payload.Status;
                request.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, request });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("requests/seen")]
        public async Task<IActionResult> MarkRequestsSeen()
        {
            try
            {
                var list = await _context.PhilopateerRequests.Where(r => !r.Seen).ToListAsync();
                foreach (var r in list)
                {
                    r.Seen = true;
                    r.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
