using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("philopateer_rules")]
    public class PhilopateerRule
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("serviceType")]
        public string ServiceType { get; set; } = string.Empty;

        [Column("minDaysRequired")]
        public int MinDaysRequired { get; set; } = 3;

        [Column("description")]
        public string Description { get; set; } = string.Empty;

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
