using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("evaluationTemplates")]
    public class EvaluationTemplate
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("type")]
        public string Type { get; set; } = "checkbox";

        [Column("serviceName")]
        public string ServiceName { get; set; } = "all";

        [Column("className")]
        public string ClassName { get; set; } = "all";

        [Column("stageName")]
        public string StageName { get; set; } = "all";

        [Column("targetDay")]
        public string TargetDay { get; set; } = "Friday";

        [Column("serviceYear")]
        public string ServiceYear { get; set; } = "2026";

        [Column("active")]
        public bool Active { get; set; } = true;

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
