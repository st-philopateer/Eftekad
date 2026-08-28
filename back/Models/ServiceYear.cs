using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("serviceYears")]
    public class ServiceYear
    {
        [Key]
        [Column("year")]
        public string Year { get; set; } = string.Empty;

        [Column("isActive")]
        public bool IsActive { get; set; } = false;

        [Column("archivedAt")]
        public string? ArchivedAt { get; set; }

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
