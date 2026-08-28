using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("preparations")]
    public class LessonPreparation
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("lessonName")]
        public string LessonName { get; set; } = string.Empty;

        [Column("objectives")]
        public string Objectives { get; set; } = string.Empty;

        [Column("deadline")]
        public string Deadline { get; set; } = string.Empty;

        [Column("serviceName")]
        public string ServiceName { get; set; } = "all";

        [Column("className")]
        public string ClassName { get; set; } = "all";

        [Column("stageName")]
        public string StageName { get; set; } = "all";

        [Column("serviceYear")]
        public string ServiceYear { get; set; } = "2026";

        [Column("createdAt")]
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
