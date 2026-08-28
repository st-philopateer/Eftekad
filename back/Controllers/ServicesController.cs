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
    [Route("api/services")]
    public class ServicesController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public ServicesController(EftekadDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetServices()
        {
            try
            {
                var list = await _context.ServiceTrees.ToListAsync();
                var result = new List<object>();

                foreach (var tree in list)
                {
                    object osras = new string[0];
                    try { osras = JsonSerializer.Deserialize<object>(tree.OsrasJson) ?? new string[0]; } catch {}

                    result.Add(new
                    {
                        id = tree.Id,
                        name = tree.Name,
                        type = tree.Type,
                        color = tree.Color,
                        serviceYear = tree.ServiceYear,
                        serviceDay = tree.ServiceDay,
                        osras = osras,
                        createdAt = tree.CreatedAt,
                        updatedAt = tree.UpdatedAt
                    });
                }

                return Ok(new { success = true, services = result, priestServices = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> SaveServices([FromBody] JsonElement payload)
        {
            try
            {
                List<JsonElement> items = new List<JsonElement>();
                if (payload.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in payload.EnumerateArray())
                    {
                        items.Add(item);
                    }
                }
                else
                {
                    items.Add(payload);
                }

                foreach (var item in items)
                {
                    string id = string.Empty;
                    if (item.TryGetProperty("id", out var idProp)) id = idProp.GetString() ?? string.Empty;
                    else if (item.TryGetProperty("_id", out var _idProp)) id = _idProp.GetString() ?? string.Empty;

                    ServiceTree? tree = null;
                    if (!string.IsNullOrEmpty(id))
                    {
                        tree = await _context.ServiceTrees.FirstOrDefaultAsync(t => t.Id == id);
                    }

                    if (tree != null)
                    {
                        // Update
                        if (item.TryGetProperty("name", out var nameProp)) tree.Name = nameProp.GetString() ?? tree.Name;
                        if (item.TryGetProperty("type", out var typeProp)) tree.Type = typeProp.GetString() ?? tree.Type;
                        if (item.TryGetProperty("color", out var colorProp)) tree.Color = colorProp.GetString() ?? tree.Color;
                        if (item.TryGetProperty("serviceYear", out var yearProp)) tree.ServiceYear = yearProp.GetString() ?? tree.ServiceYear;
                        if (item.TryGetProperty("serviceDay", out var dayProp)) tree.ServiceDay = dayProp.GetString() ?? tree.ServiceDay;
                        if (item.TryGetProperty("osras", out var osrasProp)) tree.OsrasJson = JsonSerializer.Serialize(osrasProp);
                        tree.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        // Create
                        tree = new ServiceTree
                        {
                            Id = string.IsNullOrEmpty(id) ? $"service_{DateTime.UtcNow.Ticks}" : id,
                            Name = item.TryGetProperty("name", out var nameProp) ? nameProp.GetString() ?? string.Empty : string.Empty,
                            Type = item.TryGetProperty("type", out var typeProp) ? typeProp.GetString() ?? "primary" : "primary",
                            Color = item.TryGetProperty("color", out var colorProp) ? colorProp.GetString() ?? "#c9a84c" : "#c9a84c",
                            ServiceYear = item.TryGetProperty("serviceYear", out var yearProp) ? yearProp.GetString() ?? "2026" : "2026",
                            ServiceDay = item.TryGetProperty("serviceDay", out var dayProp) ? dayProp.GetString() ?? "Friday" : "Friday",
                            OsrasJson = item.TryGetProperty("osras", out var osrasProp) ? JsonSerializer.Serialize(osrasProp) : "[]"
                        };
                        _context.ServiceTrees.Add(tree);
                    }
                }

                await _context.SaveChangesAsync();

                // Return updated list
                return await GetServices();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class SettingsPayload
        {
            public string? ChurchName { get; set; }
            public string? AppTitle { get; set; }
        }

        [HttpPost("update-settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] SettingsPayload payload)
        {
            try
            {
                if (!string.IsNullOrEmpty(payload.ChurchName))
                {
                    var meta = await _context.SystemMetas.FirstOrDefaultAsync(m => m.Key == "churchName");
                    if (meta == null)
                    {
                        meta = new SystemMeta { Key = "churchName", ValueJson = JsonSerializer.Serialize(payload.ChurchName) };
                        _context.SystemMetas.Add(meta);
                    }
                    else
                    {
                        meta.ValueJson = JsonSerializer.Serialize(payload.ChurchName);
                        meta.UpdatedAt = DateTime.UtcNow;
                    }
                }

                if (!string.IsNullOrEmpty(payload.AppTitle))
                {
                    var meta = await _context.SystemMetas.FirstOrDefaultAsync(m => m.Key == "appTitle");
                    if (meta == null)
                    {
                        meta = new SystemMeta { Key = "appTitle", ValueJson = JsonSerializer.Serialize(payload.AppTitle) };
                        _context.SystemMetas.Add(meta);
                    }
                    else
                    {
                        meta.ValueJson = JsonSerializer.Serialize(payload.AppTitle);
                        meta.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, churchName = payload.ChurchName, appTitle = payload.AppTitle });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class TransferRequestPayload
        {
            public string MakhdoomId { get; set; } = string.Empty;
            public string TargetOsra { get; set; } = string.Empty;
            public string TargetStage { get; set; } = string.Empty;
            public string TargetFasl { get; set; } = string.Empty;
            public string RequesterUsername { get; set; } = string.Empty;
        }

        [HttpPost("transfer-request")]
        public async Task<IActionResult> TransferRequest([FromBody] TransferRequestPayload payload)
        {
            try
            {
                var valObj = new
                {
                    makhdoomId = payload.MakhdoomId,
                    targetOsra = payload.TargetOsra,
                    targetStage = payload.TargetStage,
                    targetFasl = payload.TargetFasl,
                    requesterUsername = payload.RequesterUsername,
                    status = "pending",
                    createdAt = DateTime.UtcNow.ToString("o")
                };

                var meta = new SystemMeta
                {
                    Key = $"transfer_{DateTime.UtcNow.Ticks}",
                    ValueJson = JsonSerializer.Serialize(valObj)
                };

                _context.SystemMetas.Add(meta);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "تم إرسال طلب التحويل بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class TransferAcceptPayload
        {
            public string? TransferId { get; set; }
            public string MakhdoomId { get; set; } = string.Empty;
            public string TargetOsra { get; set; } = string.Empty;
            public string TargetStage { get; set; } = string.Empty;
            public string TargetFasl { get; set; } = string.Empty;
        }

        [HttpPost("transfer-accept")]
        public async Task<IActionResult> TransferAccept([FromBody] TransferAcceptPayload payload)
        {
            try
            {
                var makhdoom = await _context.Makhdomeen.FirstOrDefaultAsync(m => m.Id == payload.MakhdoomId);
                if (makhdoom != null)
                {
                    makhdoom.Osra = payload.TargetOsra;
                    makhdoom.Stage = payload.TargetStage;
                    makhdoom.Fasl = payload.TargetFasl ?? string.Empty;
                    makhdoom.UpdatedAt = DateTime.UtcNow;
                }

                if (!string.IsNullOrEmpty(payload.TransferId))
                {
                    var meta = await _context.SystemMetas.FirstOrDefaultAsync(m => m.Key == payload.TransferId);
                    if (meta != null)
                    {
                        _context.SystemMetas.Remove(meta);
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "تم قبول التحويل ونقل المخدوم بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class AssignmentItem
        {
            public string MakhdoomId { get; set; } = string.Empty;
            public string ServantUsername { get; set; } = string.Empty;
        }

        public class DistributeWaznatPayload
        {
            public string Osra { get; set; } = string.Empty;
            public string Stage { get; set; } = string.Empty;
            public string Fasl { get; set; } = string.Empty;
            public List<AssignmentItem>? Assignments { get; set; }
        }

        [HttpPost("distribute-waznat")]
        public async Task<IActionResult> DistributeWaznat([FromBody] DistributeWaznatPayload payload)
        {
            try
            {
                if (payload.Assignments != null)
                {
                    foreach (var a in payload.Assignments)
                    {
                        var makhdoom = await _context.Makhdomeen.FirstOrDefaultAsync(m => m.Id == a.MakhdoomId);
                        if (makhdoom != null)
                        {
                            makhdoom.AssignedServant = a.ServantUsername;
                            makhdoom.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                    await _context.SaveChangesAsync();
                }

                return Ok(new { success = true, message = "تم توزيع الوزنات بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
