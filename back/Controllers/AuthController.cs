using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Eftekad.Backend.Data;
using Eftekad.Backend.Models;
using System.Text.Json;

namespace Eftekad.Backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly EftekadDbContext _context;

        public AuthController(EftekadDbContext context)
        {
            _context = context;
        }

        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { error = "يرجى إدخال اسم المستخدم وكلمة المرور" });
            }

            var cleanUser = request.Username.Trim().ToLower();
            var rawUsername = request.Username.Trim();

            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Username.ToLower() == cleanUser ||
                u.Username == rawUsername ||
                u.Email.ToLower() == cleanUser);

            if (user == null || user.Password != request.Password)
            {
                return Unauthorized(new { error = "اسم المستخدم أو كلمة المرور غير صحيحة" });
            }

            if (user.Status == "blocked")
            {
                return StatusCode(403, new { error = "تم حظر هذا الحساب، يرجى مراجعة المسؤول" });
            }

            // Parse JSON fields to return proper structure to frontend
            object rolesList = new string[0];
            try { rolesList = JsonSerializer.Deserialize<object>(user.RolesListJson) ?? new string[0]; } catch {}

            object permissions = new object();
            try { permissions = JsonSerializer.Deserialize<object>(user.PermissionsJson) ?? new object(); } catch {}

            return Ok(new
            {
                success = true,
                user = new
                {
                    id = user.Id,
                    name = user.Name,
                    username = user.Username,
                    role = user.Role,
                    church = user.Church,
                    email = user.Email,
                    profilePic = user.ProfilePic,
                    osra = user.Osra,
                    rolesList = rolesList,
                    permissions = permissions,
                    assignedStage = user.AssignedStage,
                    assignedClass = user.AssignedClass
                }
            });
        }

        public class ForgotRequest
        {
            public string Email { get; set; } = string.Empty;
        }

        [HttpPost("priests/forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotRequest request)
        {
            if (string.IsNullOrEmpty(request.Email))
            {
                return BadRequest(new { error = "البريد الإلكتروني مطلوب" });
            }

            var email = request.Email.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
            if (user == null)
            {
                return NotFound(new { error = "لم يتم العثور على حساب مسجل بهذا البريد" });
            }

            return Ok(new { success = true, message = "تم إرسال تعليمات استعادة كلمة المرور إلى بريدك الإلكتروني" });
        }
    }
}
