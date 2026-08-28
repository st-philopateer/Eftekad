using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Eftekad.Backend.Data;
using Eftekad.Backend.Models;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Collections.Generic;
using System.Linq;

namespace Eftekad.Backend.Controllers
{
    [ApiController]
    [Route("api/stages-list")]
    public class StageListController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public StageListController(EftekadDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetStagesList()
        {
            try
            {
                var list = await _context.StageLists.OrderBy(s => s.Order).ToListAsync();
                var result = new List<object>();

                foreach (var s in list)
                {
                    object allowedTargets = new string[0];
                    try { allowedTargets = JsonSerializer.Deserialize<object>(s.AllowedTargetsJson) ?? new string[0]; } catch {}

                    result.Add(new
                    {
                        id = s.Id,
                        name = s.Name,
                        code = s.Code,
                        order = s.Order,
                        nextStageId = s.NextStageId,
                        isGraduation = s.IsGraduation,
                        serviceYear = s.ServiceYear,
                        promotionType = s.PromotionType,
                        allowedTargets = allowedTargets,
                        createdAt = s.CreatedAt,
                        updatedAt = s.UpdatedAt
                    });
                }

                return Ok(new { success = true, stagesList = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateStage([FromBody] JsonElement payload)
        {
            try
            {
                if (!payload.TryGetProperty("name", out var nameProp))
                {
                    return BadRequest(new { error = "اسم المرحلة مطلوب" });
                }

                var stage = new StageList
                {
                    Id = payload.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? $"stage_{DateTime.UtcNow.Ticks}" : $"stage_{DateTime.UtcNow.Ticks}",
                    Name = nameProp.GetString() ?? string.Empty,
                    Code = payload.TryGetProperty("code", out var codeProp) ? codeProp.GetString() ?? string.Empty : string.Empty,
                    Order = payload.TryGetProperty("order", out var orderProp) ? (orderProp.ValueKind == JsonValueKind.Number ? orderProp.GetInt32() : int.Parse(orderProp.GetString() ?? "0")) : 0,
                    NextStageId = payload.TryGetProperty("nextStageId", out var nextProp) ? nextProp.GetString() : null,
                    IsGraduation = payload.TryGetProperty("isGraduation", out var gradProp) && gradProp.GetBoolean(),
                    ServiceYear = payload.TryGetProperty("serviceYear", out var yearProp) ? yearProp.GetString() ?? "2026" : "2026",
                    PromotionType = payload.TryGetProperty("promotionType", out var promoProp) ? promoProp.GetString() ?? "auto" : "auto"
                };

                if (payload.TryGetProperty("allowedTargets", out var targetsProp))
                {
                    stage.AllowedTargetsJson = JsonSerializer.Serialize(targetsProp);
                }

                _context.StageLists.Add(stage);
                await _context.SaveChangesAsync();

                return await GetStagesList();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStage(string id, [FromBody] JsonElement payload)
        {
            try
            {
                var stage = await _context.StageLists.FirstOrDefaultAsync(s => s.Id == id);
                if (stage == null)
                {
                    return NotFound(new { error = "المرحلة غير موجودة" });
                }

                if (payload.TryGetProperty("name", out var nameProp)) stage.Name = nameProp.GetString() ?? stage.Name;
                if (payload.TryGetProperty("code", out var codeProp)) stage.Code = codeProp.GetString() ?? stage.Code;
                if (payload.TryGetProperty("order", out var orderProp)) stage.Order = orderProp.ValueKind == JsonValueKind.Number ? orderProp.GetInt32() : int.Parse(orderProp.GetString() ?? "0");
                if (payload.TryGetProperty("nextStageId", out var nextProp)) stage.NextStageId = nextProp.ValueKind == JsonValueKind.Null ? null : nextProp.GetString();
                if (payload.TryGetProperty("isGraduation", out var gradProp)) stage.IsGraduation = gradProp.GetBoolean();
                if (payload.TryGetProperty("serviceYear", out var yearProp)) stage.ServiceYear = yearProp.GetString() ?? stage.ServiceYear;
                if (payload.TryGetProperty("promotionType", out var promoProp)) stage.PromotionType = promoProp.GetString() ?? stage.PromotionType;

                if (payload.TryGetProperty("allowedTargets", out var targetsProp))
                {
                    stage.AllowedTargetsJson = JsonSerializer.Serialize(targetsProp);
                }

                stage.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return await GetStagesList();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStage(string id)
        {
            try
            {
                var stage = await _context.StageLists.FirstOrDefaultAsync(s => s.Id == id);
                if (stage == null)
                {
                    return NotFound(new { error = "المرحلة غير موجودة" });
                }

                var stageName = stage.Name;

                // 1. Delete from StageList
                _context.StageLists.Remove(stage);

                // 2. Cascade update Makhdoom records
                var members = await _context.Makhdomeen.Where(m => m.Stage == stageName).ToListAsync();
                foreach (var m in members)
                {
                    m.Stage = string.Empty;
                    m.Fasl = string.Empty;
                    m.UpdatedAt = DateTime.UtcNow;
                }

                // 3. Cascade delete stage configuration from ServiceTree (priestServices)
                var trees = await _context.ServiceTrees.ToListAsync();
                foreach (var tree in trees)
                {
                    bool changed = false;
                    try
                    {
                        var osrasNode = JsonNode.Parse(tree.OsrasJson);
                        if (osrasNode is JsonArray osrasArray)
                        {
                            foreach (var osra in osrasArray)
                            {
                                if (osra != null && osra["stages"] is JsonArray stagesArray)
                                {
                                    var itemsToRemove = new List<JsonNode>();
                                    foreach (var stg in stagesArray)
                                    {
                                        if (stg != null && (stg["name"]?.ToString() ?? string.Empty) == stageName)
                                        {
                                            itemsToRemove.Add(stg);
                                        }
                                    }

                                    if (itemsToRemove.Count > 0)
                                    {
                                        foreach (var r in itemsToRemove)
                                        {
                                            stagesArray.Remove(r);
                                        }
                                        changed = true;
                                    }
                                }
                            }

                            if (changed)
                            {
                                tree.OsrasJson = osrasNode.ToJsonString();
                                tree.UpdatedAt = DateTime.UtcNow;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error cascade deleting stage in service tree json: " + ex.Message);
                    }
                }

                await _context.SaveChangesAsync();

                // Fetch fresh stage list
                var list = await _context.StageLists.OrderBy(s => s.Order).ToListAsync();
                var result = new List<object>();

                foreach (var s in list)
                {
                    object allowedTargets = new string[0];
                    try { allowedTargets = JsonSerializer.Deserialize<object>(s.AllowedTargetsJson) ?? new string[0]; } catch {}

                    result.Add(new
                    {
                        id = s.Id,
                        name = s.Name,
                        code = s.Code,
                        order = s.Order,
                        nextStageId = s.NextStageId,
                        isGraduation = s.IsGraduation,
                        serviceYear = s.ServiceYear,
                        promotionType = s.PromotionType,
                        allowedTargets = allowedTargets,
                        createdAt = s.CreatedAt,
                        updatedAt = s.UpdatedAt
                    });
                }

                return Ok(new { success = true, message = "تم حذف المرحلة بنجاح", stagesList = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class PromotePayload
        {
            public List<string>? StageIds { get; set; }
        }

        [HttpPost("promote")]
        public async Task<IActionResult> PromoteStage([FromBody] PromotePayload payload)
        {
            try
            {
                if (payload?.StageIds == null || payload.StageIds.Count == 0)
                {
                    return BadRequest(new { error = "الرجاء تحديد المراحل المطلوب ترقيتها" });
                }

                var allStages = await _context.StageLists.OrderBy(s => s.Order).ToListAsync();
                int totalPromoted = 0;

                foreach (var id in payload.StageIds)
                {
                    var currentStageIndex = allStages.FindIndex(s => s.Id == id);
                    if (currentStageIndex == -1) continue;

                    var currentStage = allStages[currentStageIndex];
                    var nextStage = (currentStageIndex + 1 < allStages.Count) ? allStages[currentStageIndex + 1] : null;

                    if (currentStage.PromotionType == "manual")
                    {
                        var makhdomeenToPromote = await _context.Makhdomeen.Where(m => m.Stage == currentStage.Name).ToListAsync();
                        foreach (var m in makhdomeenToPromote)
                        {
                            m.PendingPromotionFrom = currentStage.Name;
                            m.Stage = string.Empty;
                            m.Fasl = string.Empty;
                            m.Osra = string.Empty;
                            m.UpdatedAt = DateTime.UtcNow;
                        }
                        totalPromoted += makhdomeenToPromote.Count;
                    }
                    else
                    {
                        if (nextStage != null)
                        {
                            var makhdomeenToPromote = await _context.Makhdomeen.Where(m => m.Stage == currentStage.Name).ToListAsync();
                            foreach (var m in makhdomeenToPromote)
                            {
                                m.Stage = nextStage.Name;
                                m.Fasl = string.Empty;
                                m.PendingPromotionFrom = string.Empty;
                                m.UpdatedAt = DateTime.UtcNow;
                            }
                            totalPromoted += makhdomeenToPromote.Count;
                        }
                        else
                        {
                            var makhdomeenToPromote = await _context.Makhdomeen.Where(m => m.Stage == currentStage.Name).ToListAsync();
                            foreach (var m in makhdomeenToPromote)
                            {
                                m.Stage = string.Empty;
                                m.Fasl = string.Empty;
                                m.Osra = string.Empty;
                                m.PendingPromotionFrom = string.Empty;
                                m.UpdatedAt = DateTime.UtcNow;
                            }
                            totalPromoted += makhdomeenToPromote.Count;
                        }
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, count = totalPromoted });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
