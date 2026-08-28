using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("preparationSubmissions")]
    public class PreparationSubmission
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("preparationId")]
        public string PreparationId { get; set; } = string.Empty;

        [Column("servantUsername")]
        public string ServantUsername { get; set; } = string.Empty;

        [Column("fileName")]
        public string FileName { get; set; } = string.Empty;

        [Column("fileData")]
        public string FileData { get; set; } = string.Empty; // Disk file path or base64 data

        [Column("uploadedAt")]
        public string UploadedAt { get; set; } = DateTime.UtcNow.ToString("o");

        [Column("score")]
        public int? Score { get; set; }

        [Column("comment")]
        public string? Comment { get; set; }

        [Column("evaluatedAt")]
        public string? EvaluatedAt { get; set; }

        [Column("serviceYear")]
        public string ServiceYear { get; set; } = "2026";

        [Column("lessonName")]
        public string LessonName { get; set; } = string.Empty;

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
