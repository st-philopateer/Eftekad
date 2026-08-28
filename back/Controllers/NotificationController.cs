using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Eftekad.Backend.Data;
using Eftekad.Backend.Models;
using System.Collections.Generic;
using System.Linq;

namespace Eftekad.Backend.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public NotificationController(EftekadDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] string? targetUser)
        {
            try
            {
                var query = _context.Notifications.AsQueryable();

                if (!string.IsNullOrEmpty(targetUser))
                {
                    query = query.Where(n => n.TargetUser == targetUser || n.TargetUser == "all");
                }

                var list = await query
                    .OrderByDescending(n => n.Timestamp)
                    .Take(100)
                    .ToListAsync();

                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            try
            {
                var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);
                if (notification != null)
                {
                    notification.Read = true;
                    notification.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class MarkAllPayload
        {
            public string? TargetUser { get; set; }
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead([FromBody] MarkAllPayload payload)
        {
            try
            {
                var query = _context.Notifications.AsQueryable();

                if (!string.IsNullOrEmpty(payload.TargetUser))
                {
                    query = query.Where(n => n.TargetUser == payload.TargetUser || n.TargetUser == "all");
                }

                var list = await query.ToListAsync();
                foreach (var n in list)
                {
                    n.Read = true;
                    n.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("sync-messages")]
        public async Task<IActionResult> GetSyncMessages([FromQuery] string? targetUser)
        {
            try
            {
                var query = _context.Notifications.AsQueryable();

                if (!string.IsNullOrEmpty(targetUser))
                {
                    query = query.Where(n => n.TargetUser == targetUser || n.TargetUser == "all");
                }

                var list = await query.ToListAsync();
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
