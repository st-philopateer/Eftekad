using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Eftekad.Backend.Data;
using Eftekad.Backend.Models;

namespace Eftekad.Backend.Controllers
{
    [ApiController]
    [Route("api/servant-visitations")]
    public class VisitationController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public VisitationController(EftekadDbContext context)
        {
            _context = context;
        }

        public class SaveVisitationPayload
        {
            public string ServantUsername { get; set; } = string.Empty;
            public string MakhdoomId { get; set; } = string.Empty;
            public string WeekDate { get; set; } = string.Empty;
            public string? Result { get; set; }
            public string? Notes { get; set; }
            public string? ServiceYear { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> SaveServantVisitation([FromBody] SaveVisitationPayload payload)
        {
            try
            {
                if (string.IsNullOrEmpty(payload.ServantUsername) || string.IsNullOrEmpty(payload.MakhdoomId) || string.IsNullOrEmpty(payload.WeekDate))
                {
                    return BadRequest(new { error = "بيانات الافتقاد غير مكتملة" });
                }

                var visitation = await _context.Visitations.FirstOrDefaultAsync(v =>
                    v.ServantUsername == payload.ServantUsername &&
                    v.MakhdoomId == payload.MakhdoomId &&
                    v.WeekDate == payload.WeekDate);

                if (visitation != null)
                {
                    visitation.Result = payload.Result ?? "answered";
                    visitation.Notes = payload.Notes ?? string.Empty;
                    visitation.ScannedAt = DateTime.UtcNow.ToString("o");
                    visitation.ServiceYear = payload.ServiceYear ?? visitation.ServiceYear;
                    visitation.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    visitation = new Visitation
                    {
                        Id = $"vis_{DateTime.UtcNow.Ticks}",
                        ServantUsername = payload.ServantUsername,
                        MakhdoomId = payload.MakhdoomId,
                        WeekDate = payload.WeekDate,
                        Result = payload.Result ?? "answered",
                        Notes = payload.Notes ?? string.Empty,
                        ScannedAt = DateTime.UtcNow.ToString("o"),
                        ServiceYear = payload.ServiceYear ?? "2026"
                    };
                    _context.Visitations.Add(visitation);
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, visitation });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
