using System;
using System.IO;
using System.Text.RegularExpressions;
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
    [Route("api/preparations")]
    public class PreparationsController : ControllerBase
    {
        private readonly EftekadDbContext _context;
        private readonly string _uploadsDir;

        public PreparationsController(EftekadDbContext context)
        {
            _context = context;
            _uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(_uploadsDir))
            {
                Directory.CreateDirectory(_uploadsDir);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetPreparations()
        {
            try
            {
                var list = await _context.LessonPreparations.ToListAsync();
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreatePreparation([FromBody] LessonPreparation data)
        {
            try
            {
                if (string.IsNullOrEmpty(data.LessonName))
                {
                    return BadRequest(new { error = "اسم الدرس مطلوب" });
                }

                data.Id = string.IsNullOrEmpty(data.Id) ? $"prep_{DateTime.UtcNow.Ticks}" : data.Id;
                data.CreatedAt = DateTime.UtcNow.ToString("o");

                _context.LessonPreparations.Add(data);
                await _context.SaveChangesAsync();

                return Created($"/api/preparations/{data.Id}", new
                {
                    success = true,
                    id = data.Id,
                    lessonName = data.LessonName,
                    objectives = data.Objectives,
                    deadline = data.Deadline,
                    serviceName = data.ServiceName,
                    className = data.ClassName,
                    stageName = data.StageName,
                    serviceYear = data.ServiceYear,
                    createdAt = data.CreatedAt,
                    updatedAt = data.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePreparation(string id)
        {
            try
            {
                var prep = await _context.LessonPreparations.FirstOrDefaultAsync(p => p.Id == id);
                if (prep != null)
                {
                    _context.LessonPreparations.Remove(prep);
                }

                var submissions = await _context.PreparationSubmissions.Where(s => s.PreparationId == id).ToListAsync();
                if (submissions.Any())
                {
                    _context.PreparationSubmissions.RemoveRange(submissions);
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "تم حذف التحضير بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("submissions")]
        public async Task<IActionResult> GetSubmissions()
        {
            try
            {
                var list = await _context.PreparationSubmissions.ToListAsync();
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class SubmitPayload
        {
            public string PreparationId { get; set; } = string.Empty;
            public string ServantUsername { get; set; } = string.Empty;
            public string? FileName { get; set; }
            public string FileData { get; set; } = string.Empty;
            public string? ServiceYear { get; set; }
            public string? LessonName { get; set; }
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitPreparation([FromBody] SubmitPayload payload)
        {
            try
            {
                if (string.IsNullOrEmpty(payload.PreparationId) || string.IsNullOrEmpty(payload.ServantUsername) || string.IsNullOrEmpty(payload.FileData))
                {
                    return BadRequest(new { error = "بيانات التسليم غير مكتملة" });
                }

                string finalLessonName = payload.LessonName ?? string.Empty;
                if (string.IsNullOrEmpty(finalLessonName))
                {
                    var prep = await _context.LessonPreparations.FirstOrDefaultAsync(p => p.Id == payload.PreparationId);
                    if (prep != null)
                    {
                        finalLessonName = prep.LessonName;
                    }
                }

                string savedPath = SaveBase64File(payload.FileData, payload.FileName ?? "lesson.pdf");

                var submission = await _context.PreparationSubmissions.FirstOrDefaultAsync(s =>
                    s.PreparationId == payload.PreparationId &&
                    s.ServantUsername.ToLower().Trim() == payload.ServantUsername.ToLower().Trim());

                if (submission != null)
                {
                    submission.FileName = payload.FileName ?? "file.pdf";
                    submission.FileData = savedPath;
                    submission.UploadedAt = DateTime.UtcNow.ToString("o");
                    submission.ServiceYear = payload.ServiceYear ?? submission.ServiceYear;
                    if (!string.IsNullOrEmpty(finalLessonName))
                    {
                        submission.LessonName = finalLessonName;
                    }
                    submission.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    submission = new PreparationSubmission
                    {
                        Id = $"sub_{DateTime.UtcNow.Ticks}",
                        PreparationId = payload.PreparationId,
                        ServantUsername = payload.ServantUsername.Trim(),
                        FileName = payload.FileName ?? "file.pdf",
                        FileData = savedPath,
                        UploadedAt = DateTime.UtcNow.ToString("o"),
                        ServiceYear = payload.ServiceYear ?? "2026",
                        LessonName = finalLessonName
                    };
                    _context.PreparationSubmissions.Add(submission);
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, submission });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class EvaluatePayload
        {
            public int? Score { get; set; }
            public string? Comment { get; set; }
            public string? EvaluatedBy { get; set; }
        }

        [HttpPost("submissions/{id}/evaluate")]
        public async Task<IActionResult> EvaluateSubmission(string id, [FromBody] EvaluatePayload payload)
        {
            try
            {
                var submission = await _context.PreparationSubmissions.FirstOrDefaultAsync(s => s.Id == id);
                if (submission == null)
                {
                    return NotFound(new { error = "لم يتم العثور على التسليم" });
                }

                string lessonName = submission.LessonName;
                if (string.IsNullOrEmpty(lessonName))
                {
                    var prep = await _context.LessonPreparations.FirstOrDefaultAsync(p => p.Id == submission.PreparationId);
                    if (prep != null)
                    {
                        lessonName = prep.LessonName;
                    }
                }

                submission.Score = payload.Score;
                submission.Comment = (payload.Comment ?? string.Empty).Trim();
                submission.EvaluatedAt = DateTime.UtcNow.ToString("o");
                if (!string.IsNullOrEmpty(lessonName))
                {
                    submission.LessonName = lessonName;
                }
                submission.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { success = true, submission });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private string SaveBase64File(string base64Data, string originalFileName)
        {
            if (string.IsNullOrEmpty(base64Data)) return base64Data;
            if (!base64Data.StartsWith("data:application/pdf;base64,"))
            {
                return base64Data; // Not a base64 string
            }

            try
            {
                var rawBase64 = base64Data.Substring(base64Data.IndexOf("base64,") + 7);
                var bytes = Convert.FromBase64String(rawBase64);

                var safeName = Regex.Replace(originalFileName, @"[^a-zA-Z0-9._-]", "_");
                var uniqueName = $"prep_{DateTime.UtcNow.Ticks}_{new Random().Next(100000, 999999)}_{safeName}";
                var filePath = Path.Combine(_uploadsDir, uniqueName);

                System.IO.File.WriteAllBytes(filePath, bytes);
                return $"/uploads/{uniqueName}";
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error saving base64 to disk: " + ex.Message);
                return base64Data;
            }
        }
    }
}
