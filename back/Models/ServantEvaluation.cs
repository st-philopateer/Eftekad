using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("servantEvaluations")]
    public class ServantEvaluation
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("templateId")]
        public string TemplateId { get; set; } = string.Empty;

        [Column("servantUsername")]
        public string ServantUsername { get; set; } = string.Empty;

        [Column("weekDate")]
        public string WeekDate { get; set; } = string.Empty;

        [Column("valueJson")]
        public string ValueJson { get; set; } = "false"; // Stored as JSON string (mixed value: bool, number, etc.)

        [Column("scannedAt")]
        public string ScannedAt { get; set; } = DateTime.UtcNow.ToString("o");

        [Column("serviceYear")]
        public string ServiceYear { get; set; } = "2026";

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
