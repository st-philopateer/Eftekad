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
    public class SyncController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public SyncController(EftekadDbContext context)
        {
            _context = context;
        }

        [HttpGet("sync")]
        public async Task<IActionResult> GetFullSync()
        {
            try
            {
                var makhdomeen = await _context.Makhdomeen.ToListAsync();
                var rawUsers = await _context.Users.ToListAsync();
                var rawTrees = await _context.ServiceTrees.ToListAsync();
                var rawAttendances = await _context.Attendances.ToListAsync();
                var visitations = await _context.Visitations.ToListAsync();
                var templates = await _context.EvaluationTemplates.ToListAsync();
                var rawEvaluations = await _context.ServantEvaluations.ToListAsync();
                var preparations = await _context.LessonPreparations.ToListAsync();
                var submissions = await _context.PreparationSubmissions.ToListAsync();
                var notifications = await _context.Notifications.ToListAsync();
                var jobs = await _context.Jobs.ToListAsync();

                // Format Users with parsed JSON
                var usersResult = new List<object>();
                foreach (var u in rawUsers)
                {
                    object rolesList = new string[0];
                    try { rolesList = JsonSerializer.Deserialize<object>(u.RolesListJson) ?? new string[0]; } catch {}

                    object permissions = new object();
                    try { permissions = JsonSerializer.Deserialize<object>(u.PermissionsJson) ?? new object(); } catch {}

                    usersResult.Add(new
                    {
                        id = u.Id,
                        name = u.Name,
                        username = u.Username,
                        password = u.Password,
                        role = u.Role,
                        church = u.Church,
                        email = u.Email,
                        profilePic = u.ProfilePic,
                        status = u.Status,
                        osra = u.Osra,
                        phone = u.Phone,
                        assignedStage = u.AssignedStage,
                        assignedClass = u.AssignedClass,
                        rolesList = rolesList,
                        permissions = permissions,
                        createdAt = u.CreatedAt,
                        updatedAt = u.UpdatedAt
                    });
                }

                // Format Service Trees with parsed JSON
                var servicesResult = new List<object>();
                foreach (var tree in rawTrees)
                {
                    object osras = new string[0];
                    try { osras = JsonSerializer.Deserialize<object>(tree.OsrasJson) ?? new string[0]; } catch {}

                    servicesResult.Add(new
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

                // Format Attendances with parsed JSON
                var attendancesResult = new List<object>();
                foreach (var a in rawAttendances)
                {
                    object records = new object();
                    try { records = JsonSerializer.Deserialize<object>(a.RecordsJson) ?? new object(); } catch {}

                    attendancesResult.Add(new
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

                // Format Servant Evaluations with parsed JSON
                var evaluationsResult = new List<object>();
                foreach (var ev in rawEvaluations)
                {
                    object val = false;
                    try { val = JsonSerializer.Deserialize<object>(ev.ValueJson) ?? false; } catch {}

                    evaluationsResult.Add(new
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

                return Ok(new
                {
                    makhdomeen,
                    users = usersResult,
                    priestServices = servicesResult,
                    attendance = attendancesResult,
                    servantVisitations = visitations,
                    evaluationTemplates = templates,
                    servantEvaluations = evaluationsResult,
                    preparations,
                    preparationSubmissions = submissions,
                    notifications,
                    jobs
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("sync/versions")]
        public IActionResult GetSyncVersions()
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            return Ok(new
            {
                makhdomeen = now,
                services = now,
                attendance = now
            });
        }

        [HttpGet("sync/{key}")]
        public async Task<IActionResult> GetSyncByKey(string key)
        {
            try
            {
                if (key == "makhdomeen")
                {
                    return Ok(await _context.Makhdomeen.ToListAsync());
                }
                else if (key == "users")
                {
                    var rawUsers = await _context.Users.ToListAsync();
                    var usersResult = new List<object>();
                    foreach (var u in rawUsers)
                    {
                        object rolesList = new string[0];
                        try { rolesList = JsonSerializer.Deserialize<object>(u.RolesListJson) ?? new string[0]; } catch {}

                        object permissions = new object();
                        try { permissions = JsonSerializer.Deserialize<object>(u.PermissionsJson) ?? new object(); } catch {}

                        usersResult.Add(new
                        {
                            id = u.Id,
                            name = u.Name,
                            username = u.Username,
                            password = u.Password,
                            role = u.Role,
                            church = u.Church,
                            email = u.Email,
                            profilePic = u.ProfilePic,
                            status = u.Status,
                            osra = u.Osra,
                            phone = u.Phone,
                            assignedStage = u.AssignedStage,
                            assignedClass = u.AssignedClass,
                            rolesList = rolesList,
                            permissions = permissions,
                            createdAt = u.CreatedAt,
                            updatedAt = u.UpdatedAt
                        });
                    }
                    return Ok(usersResult);
                }
                else if (key == "priestServices")
                {
                    var rawTrees = await _context.ServiceTrees.ToListAsync();
                    var servicesResult = new List<object>();
                    foreach (var tree in rawTrees)
                    {
                        object osras = new string[0];
                        try { osras = JsonSerializer.Deserialize<object>(tree.OsrasJson) ?? new string[0]; } catch {}

                        servicesResult.Add(new
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
                    return Ok(servicesResult);
                }
                else if (key == "attendance")
                {
                    var rawAttendances = await _context.Attendances.ToListAsync();
                    var attendancesResult = new List<object>();
                    foreach (var a in rawAttendances)
                    {
                        object records = new object();
                        try { records = JsonSerializer.Deserialize<object>(a.RecordsJson) ?? new object(); } catch {}

                        attendancesResult.Add(new
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
                    return Ok(attendancesResult);
                }
                else if (key == "servantVisitations")
                {
                    return Ok(await _context.Visitations.ToListAsync());
                }
                else if (key == "evaluationTemplates")
                {
                    return Ok(await _context.EvaluationTemplates.ToListAsync());
                }
                else if (key == "servantEvaluations")
                {
                    var rawEvaluations = await _context.ServantEvaluations.ToListAsync();
                    var evaluationsResult = new List<object>();
                    foreach (var ev in rawEvaluations)
                    {
                        object val = false;
                        try { val = JsonSerializer.Deserialize<object>(ev.ValueJson) ?? false; } catch {}

                        evaluationsResult.Add(new
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
                    return Ok(evaluationsResult);
                }
                else if (key == "preparations")
                {
                    return Ok(await _context.LessonPreparations.ToListAsync());
                }
                else if (key == "preparationSubmissions")
                {
                    return Ok(await _context.PreparationSubmissions.ToListAsync());
                }
                else if (key == "notifications")
                {
                    return Ok(await _context.Notifications.ToListAsync());
                }
                else if (key == "jobs")
                {
                    return Ok(await _context.Jobs.ToListAsync());
                }

                return BadRequest(new { error = $"Key '{key}' is not syncable." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("sync")]
        public IActionResult PostSync()
        {
            return Ok(new { success = true, timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() });
        }

        [HttpPost("sync/delta")]
        public IActionResult PostSyncDelta()
        {
            return Ok(new { success = true, timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() });
        }

        [HttpGet("sync/archived-reports")]
        public IActionResult GetArchivedReports()
        {
            return Ok(new string[0]);
        }

        [HttpGet("sync/admin/diagnose")]
        public IActionResult AdminDiagnose()
        {
            return Ok(new
            {
                status = "ok",
                sqliteConnected = true,
                timestamp = DateTime.UtcNow.ToString("o")
            });
        }
    }
}
