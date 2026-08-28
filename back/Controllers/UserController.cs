using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Eftekad.Backend.Data;
using Eftekad.Backend.Models;
using System.Text.Json;
using System.Collections.Generic;

namespace Eftekad.Backend.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public UserController(EftekadDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _context.Users.ToListAsync();
                var result = new List<object>();

                foreach (var u in users)
                {
                    object rolesList = new string[0];
                    try { rolesList = JsonSerializer.Deserialize<object>(u.RolesListJson) ?? new string[0]; } catch {}

                    object permissions = new object();
                    try { permissions = JsonSerializer.Deserialize<object>(u.PermissionsJson) ?? new object(); } catch {}

                    result.Add(new
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

                return Ok(new { success = true, users = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] JsonElement payload)
        {
            try
            {
                if (!payload.TryGetProperty("username", out var usernameProp) || !payload.TryGetProperty("name", out var nameProp))
                {
                    return BadRequest(new { error = "اسم المستخدم والاسم مطلوبان" });
                }

                var rawUsername = usernameProp.GetString() ?? string.Empty;
                var cleanUsername = rawUsername.Trim().ToLower();

                var existing = await _context.Users.AnyAsync(u => u.Username.ToLower() == cleanUsername);
                if (existing)
                {
                    return BadRequest(new { error = "اسم المستخدم مسجل بالفعل" });
                }

                var user = new User
                {
                    Id = payload.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? DateTime.UtcNow.Ticks.ToString() : DateTime.UtcNow.Ticks.ToString(),
                    Name = nameProp.GetString() ?? string.Empty,
                    Username = cleanUsername,
                    Password = payload.TryGetProperty("password", out var pwdProp) ? pwdProp.GetString() ?? string.Empty : string.Empty,
                    Role = payload.TryGetProperty("role", out var rProp) ? rProp.GetString() ?? "servant" : "servant",
                    Church = payload.TryGetProperty("church", out var cProp) ? cProp.GetString() ?? string.Empty : string.Empty,
                    Email = payload.TryGetProperty("email", out var eProp) ? eProp.GetString() ?? string.Empty : string.Empty,
                    ProfilePic = payload.TryGetProperty("profilePic", out var pPicProp) ? pPicProp.GetString() ?? string.Empty : string.Empty,
                    Status = payload.TryGetProperty("status", out var statusProp) ? statusProp.GetString() ?? "active" : "active",
                    Osra = payload.TryGetProperty("osra", out var osraProp) ? osraProp.GetString() ?? string.Empty : string.Empty,
                    Phone = payload.TryGetProperty("phone", out var phoneProp) ? phoneProp.GetString() ?? string.Empty : string.Empty,
                    AssignedStage = payload.TryGetProperty("assignedStage", out var stgProp) ? stgProp.GetString() ?? string.Empty : string.Empty,
                    AssignedClass = payload.TryGetProperty("assignedClass", out var clsProp) ? clsProp.GetString() ?? string.Empty : string.Empty
                };

                if (payload.TryGetProperty("rolesList", out var rolesProp))
                {
                    user.RolesListJson = JsonSerializer.Serialize(rolesProp);
                }
                if (payload.TryGetProperty("permissions", out var permsProp))
                {
                    user.PermissionsJson = JsonSerializer.Serialize(permsProp);
                }

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                object rolesList = new string[0];
                try { rolesList = JsonSerializer.Deserialize<object>(user.RolesListJson) ?? new string[0]; } catch {}

                object permissions = new object();
                try { permissions = JsonSerializer.Deserialize<object>(user.PermissionsJson) ?? new object(); } catch {}

                return Created($"/api/users/{user.Username}", new
                {
                    success = true,
                    id = user.Id,
                    name = user.Name,
                    username = user.Username,
                    password = user.Password,
                    role = user.Role,
                    church = user.Church,
                    email = user.Email,
                    profilePic = user.ProfilePic,
                    status = user.Status,
                    osra = user.Osra,
                    phone = user.Phone,
                    assignedStage = user.AssignedStage,
                    assignedClass = user.AssignedClass,
                    rolesList = rolesList,
                    permissions = permissions,
                    createdAt = user.CreatedAt,
                    updatedAt = user.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] JsonElement payload)
        {
            try
            {
                if (!payload.TryGetProperty("username", out var usernameProp))
                {
                    return BadRequest(new { error = "اسم المستخدم مطلوب" });
                }

                var cleanUsername = (usernameProp.GetString() ?? string.Empty).Trim().ToLower();
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == cleanUsername);
                if (user == null)
                {
                    return NotFound(new { error = "المستخدم غير موجود" });
                }

                if (payload.TryGetProperty("name", out var nameProp))
                {
                    user.Name = nameProp.GetString() ?? user.Name;
                }
                if (payload.TryGetProperty("email", out var emailProp))
                {
                    user.Email = emailProp.GetString() ?? user.Email;
                }
                if (payload.TryGetProperty("password", out var pwdProp))
                {
                    user.Password = pwdProp.GetString() ?? user.Password;
                }

                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, user });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("admin-update")]
        public async Task<IActionResult> AdminUpdateUser([FromBody] JsonElement payload)
        {
            try
            {
                if (!payload.TryGetProperty("username", out var usernameProp))
                {
                    return BadRequest(new { error = "اسم المستخدم مطلوب" });
                }

                var cleanUsername = (usernameProp.GetString() ?? string.Empty).Trim().ToLower();
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == cleanUsername);
                if (user == null)
                {
                    return NotFound(new { error = "المستخدم غير موجود" });
                }

                // Update properties if defined in payload
                if (payload.TryGetProperty("name", out var nameProp)) user.Name = nameProp.GetString() ?? user.Name;
                if (payload.TryGetProperty("role", out var roleProp)) user.Role = roleProp.GetString() ?? user.Role;
                if (payload.TryGetProperty("password", out var pwdProp)) user.Password = pwdProp.GetString() ?? user.Password;
                if (payload.TryGetProperty("email", out var emailProp)) user.Email = emailProp.GetString() ?? user.Email;
                if (payload.TryGetProperty("church", out var churchProp)) user.Church = churchProp.GetString() ?? user.Church;
                if (payload.TryGetProperty("status", out var statusProp)) user.Status = statusProp.GetString() ?? user.Status;
                if (payload.TryGetProperty("osra", out var osraProp)) user.Osra = osraProp.GetString() ?? user.Osra;
                if (payload.TryGetProperty("phone", out var phoneProp)) user.Phone = phoneProp.GetString() ?? user.Phone;
                if (payload.TryGetProperty("assignedStage", out var stgProp)) user.AssignedStage = stgProp.GetString() ?? user.AssignedStage;
                if (payload.TryGetProperty("assignedClass", out var clsProp)) user.AssignedClass = clsProp.GetString() ?? user.AssignedClass;

                if (payload.TryGetProperty("rolesList", out var rolesProp))
                {
                    user.RolesListJson = JsonSerializer.Serialize(rolesProp);
                }
                if (payload.TryGetProperty("permissions", out var permsProp))
                {
                    user.PermissionsJson = JsonSerializer.Serialize(permsProp);
                }

                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, user });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("profile-pic")]
        public async Task<IActionResult> UpdateProfilePic([FromBody] JsonElement payload)
        {
            try
            {
                if (!payload.TryGetProperty("username", out var usernameProp) || !payload.TryGetProperty("profilePic", out var picProp))
                {
                    return BadRequest(new { error = "اسم المستخدم مطلوب" });
                }

                var cleanUsername = (usernameProp.GetString() ?? string.Empty).Trim().ToLower();
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == cleanUsername);
                if (user == null)
                {
                    return NotFound(new { error = "المستخدم غير موجود" });
                }

                user.ProfilePic = picProp.GetString() ?? string.Empty;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, user });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("profile-pic")]
        public async Task<IActionResult> DeleteProfilePic([FromBody] JsonElement payload)
        {
            try
            {
                if (!payload.TryGetProperty("username", out var usernameProp))
                {
                    return BadRequest(new { error = "اسم المستخدم مطلوب" });
                }

                var cleanUsername = (usernameProp.GetString() ?? string.Empty).Trim().ToLower();
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == cleanUsername);
                if (user == null)
                {
                    return NotFound(new { error = "المستخدم غير موجود" });
                }

                user.ProfilePic = string.Empty;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, user });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{username}")]
        public async Task<IActionResult> DeleteUser(string username)
        {
            try
            {
                if (string.IsNullOrEmpty(username))
                {
                    return BadRequest(new { error = "اسم المستخدم مطلوب" });
                }

                var cleanUsername = username.Trim().ToLower();
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == cleanUsername);
                if (user != null)
                {
                    _context.Users.Remove(user);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { success = true, message = "تم حذف المستخدم بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
