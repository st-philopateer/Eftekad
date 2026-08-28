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
    [Route("api/makhdomeen")]
    public class MakhdomeenController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public MakhdomeenController(EftekadDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMakhdomeen([FromQuery] string? year, [FromQuery] string? osra, [FromQuery] string? stage, [FromQuery] string? fasl)
        {
            try
            {
                var query = _context.Makhdomeen.AsQueryable();

                if (!string.IsNullOrEmpty(year)) query = query.Where(m => m.ServiceYear == year);
                if (!string.IsNullOrEmpty(osra)) query = query.Where(m => m.Osra == osra);
                if (!string.IsNullOrEmpty(stage)) query = query.Where(m => m.Stage == stage);
                if (!string.IsNullOrEmpty(fasl)) query = query.Where(m => m.Fasl == fasl);

                var list = await query.ToListAsync();
                return Ok(new { success = true, makhdomeen = list });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateMakhdoom([FromBody] Makhdoom makhdoom)
        {
            try
            {
                if (string.IsNullOrEmpty(makhdoom.Name))
                {
                    return BadRequest(new { error = "اسم المخدوم مطلوب" });
                }

                if (string.IsNullOrEmpty(makhdoom.Id))
                {
                    makhdoom.Id = $"{DateTime.UtcNow.Ticks}{new Random().Next(1000, 9999)}";
                }

                makhdoom.Status = string.IsNullOrEmpty(makhdoom.Status) ? "active" : makhdoom.Status;
                makhdoom.Timestamp = string.IsNullOrEmpty(makhdoom.Timestamp) ? DateTime.UtcNow.ToString("o") : makhdoom.Timestamp;

                _context.Makhdomeen.Add(makhdoom);
                await _context.SaveChangesAsync();

                return Created($"/api/makhdomeen/{makhdoom.Id}", new
                {
                    success = true,
                    id = makhdoom.Id,
                    name = makhdoom.Name,
                    gender = makhdoom.Gender,
                    osra = makhdoom.Osra,
                    stage = makhdoom.Stage,
                    fasl = makhdoom.Fasl,
                    phone = makhdoom.Phone,
                    address = makhdoom.Address,
                    area = makhdoom.Area,
                    street = makhdoom.Street,
                    building = makhdoom.Building,
                    floor = makhdoom.Floor,
                    apartment = makhdoom.Apartment,
                    notes = makhdoom.Notes,
                    serviceYear = makhdoom.ServiceYear,
                    status = makhdoom.Status,
                    assignedServant = makhdoom.AssignedServant,
                    code = makhdoom.Code,
                    timestamp = makhdoom.Timestamp,
                    birthDate = makhdoom.BirthDate,
                    pendingPromotionFrom = makhdoom.PendingPromotionFrom,
                    createdAt = makhdoom.CreatedAt,
                    updatedAt = makhdoom.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMakhdoom(string id, [FromBody] JsonElement updateData)
        {
            try
            {
                var makhdoom = await _context.Makhdomeen.FirstOrDefaultAsync(m => m.Id == id);
                if (makhdoom == null)
                {
                    return NotFound(new { error = "المخدوم غير موجود" });
                }

                // Update properties dynamically
                if (updateData.TryGetProperty("name", out var nameProp)) makhdoom.Name = nameProp.GetString() ?? makhdoom.Name;
                if (updateData.TryGetProperty("gender", out var genderProp)) makhdoom.Gender = genderProp.GetString() ?? makhdoom.Gender;
                if (updateData.TryGetProperty("osra", out var osraProp)) makhdoom.Osra = osraProp.GetString() ?? makhdoom.Osra;
                if (updateData.TryGetProperty("stage", out var stageProp)) makhdoom.Stage = stageProp.GetString() ?? makhdoom.Stage;
                if (updateData.TryGetProperty("fasl", out var faslProp)) makhdoom.Fasl = faslProp.GetString() ?? makhdoom.Fasl;
                if (updateData.TryGetProperty("phone", out var phoneProp)) makhdoom.Phone = phoneProp.GetString() ?? makhdoom.Phone;
                if (updateData.TryGetProperty("address", out var addrProp)) makhdoom.Address = addrProp.GetString() ?? makhdoom.Address;
                if (updateData.TryGetProperty("area", out var areaProp)) makhdoom.Area = areaProp.GetString() ?? makhdoom.Area;
                if (updateData.TryGetProperty("street", out var streetProp)) makhdoom.Street = streetProp.GetString() ?? makhdoom.Street;
                if (updateData.TryGetProperty("building", out var buildingProp)) makhdoom.Building = buildingProp.GetString() ?? makhdoom.Building;
                if (updateData.TryGetProperty("floor", out var floorProp)) makhdoom.Floor = floorProp.GetString() ?? makhdoom.Floor;
                if (updateData.TryGetProperty("apartment", out var aptProp)) makhdoom.Apartment = aptProp.GetString() ?? makhdoom.Apartment;
                if (updateData.TryGetProperty("notes", out var notesProp)) makhdoom.Notes = notesProp.GetString() ?? makhdoom.Notes;
                if (updateData.TryGetProperty("serviceYear", out var yearProp)) makhdoom.ServiceYear = yearProp.GetString() ?? makhdoom.ServiceYear;
                if (updateData.TryGetProperty("status", out var statusProp)) makhdoom.Status = statusProp.GetString() ?? makhdoom.Status;
                if (updateData.TryGetProperty("birthDate", out var birthProp)) makhdoom.BirthDate = birthProp.GetString() ?? makhdoom.BirthDate;
                if (updateData.TryGetProperty("code", out var codeProp)) makhdoom.Code = codeProp.GetString() ?? makhdoom.Code;
                if (updateData.TryGetProperty("pendingPromotionFrom", out var promoProp)) makhdoom.PendingPromotionFrom = promoProp.GetString() ?? makhdoom.PendingPromotionFrom;

                if (updateData.TryGetProperty("assignedServant", out var servantProp))
                {
                    makhdoom.AssignedServant = servantProp.ValueKind == JsonValueKind.Null ? null : servantProp.GetString();
                }

                makhdoom.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "تم تحديث البيانات بنجاح", makhdoom });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMakhdoom(string id)
        {
            try
            {
                var makhdoom = await _context.Makhdomeen.FirstOrDefaultAsync(m => m.Id == id);
                if (makhdoom != null)
                {
                    _context.Makhdomeen.Remove(makhdoom);
                    await _context.SaveChangesAsync();
                }
                return Ok(new { success = true, message = "تم حذف المخدوم بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class BatchUpdatePayload
        {
            public List<MakhdoomUpdateItem>? Updates { get; set; }
        }

        public class MakhdoomUpdateItem
        {
            public string Id { get; set; } = string.Empty;
            public JsonElement Changes { get; set; }
        }

        [HttpPost("batch-update")]
        public async Task<IActionResult> BatchUpdateMakhdomeen([FromBody] BatchUpdatePayload payload)
        {
            try
            {
                if (payload?.Updates == null)
                {
                    return BadRequest(new { error = "Invalid updates payload" });
                }

                foreach (var update in payload.Updates)
                {
                    var makhdoom = await _context.Makhdomeen.FirstOrDefaultAsync(m => m.Id == update.Id);
                    if (makhdoom != null)
                    {
                        var changes = update.Changes;
                        if (changes.TryGetProperty("assignedServant", out var servantProp))
                        {
                            makhdoom.AssignedServant = servantProp.ValueKind == JsonValueKind.Null ? null : servantProp.GetString();
                        }
                        if (changes.TryGetProperty("fasl", out var faslProp))
                        {
                            makhdoom.Fasl = faslProp.GetString() ?? makhdoom.Fasl;
                        }
                        if (changes.TryGetProperty("stage", out var stageProp))
                        {
                            makhdoom.Stage = stageProp.GetString() ?? makhdoom.Stage;
                        }
                        if (changes.TryGetProperty("osra", out var osraProp))
                        {
                            makhdoom.Osra = osraProp.GetString() ?? makhdoom.Osra;
                        }
                        if (changes.TryGetProperty("pendingPromotionFrom", out var promoProp))
                        {
                            makhdoom.PendingPromotionFrom = promoProp.ValueKind == JsonValueKind.Null ? null : promoProp.GetString();
                        }
                        makhdoom.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, count = payload.Updates.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class RenameClassPayload
        {
            public string Osra { get; set; } = string.Empty;
            public string Stage { get; set; } = string.Empty;
            public string OldClassName { get; set; } = string.Empty;
            public string NewClassName { get; set; } = string.Empty;
        }

        [HttpPost("rename-class")]
        public async Task<IActionResult> RenameClass([FromBody] RenameClassPayload payload)
        {
            try
            {
                if (string.IsNullOrEmpty(payload.Osra) || string.IsNullOrEmpty(payload.Stage) || string.IsNullOrEmpty(payload.OldClassName) || string.IsNullOrEmpty(payload.NewClassName))
                {
                    return BadRequest(new { error = "جميع الحقول مطلوبة" });
                }

                var members = await _context.Makhdomeen.Where(m =>
                    m.Osra == payload.Osra &&
                    m.Stage == payload.Stage &&
                    m.Fasl == payload.OldClassName).ToListAsync();

                foreach (var m in members)
                {
                    m.Fasl = payload.NewClassName;
                    m.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, modifiedCount = members.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class PromoteMakhdoomPayload
        {
            public string NextStage { get; set; } = string.Empty;
            public string? NextFasl { get; set; }
        }

        [HttpPost("{id}/promote")]
        public async Task<IActionResult> PromoteMakhdoom(string id, [FromBody] PromoteMakhdoomPayload payload)
        {
            try
            {
                var makhdoom = await _context.Makhdomeen.FirstOrDefaultAsync(m => m.Id == id);
                if (makhdoom == null)
                {
                    return NotFound(new { error = "المخدوم غير موجود" });
                }

                makhdoom.Stage = payload.NextStage;
                makhdoom.Fasl = payload.NextFasl ?? string.Empty;
                makhdoom.PendingPromotionFrom = null;
                makhdoom.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { success = true, makhdoom });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
