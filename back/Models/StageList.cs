using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("stagesList")]
    public class StageList
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("code")]
        public string Code { get; set; } = string.Empty;

        [Column("order")]
        public int Order { get; set; } = 0;

        [Column("nextStageId")]
        public string? NextStageId { get; set; }

        [Column("isGraduation")]
        public bool IsGraduation { get; set; } = false;

        [Column("serviceYear")]
        public string ServiceYear { get; set; } = "2026";

        [Column("promotionType")]
        public string PromotionType { get; set; } = "auto"; // auto, manual

        [Column("allowedTargetsJson")]
        public string AllowedTargetsJson { get; set; } = "[]"; // Serialized JSON string array for manual promotion targets

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
