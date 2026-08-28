using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("servantVisitations")]
    public class Visitation
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("servantUsername")]
        public string ServantUsername { get; set; } = string.Empty;

        [Column("makhdoomId")]
        public string MakhdoomId { get; set; } = string.Empty;

        [Column("weekDate")]
        public string WeekDate { get; set; } = string.Empty;

        [Column("result")]
        public string Result { get; set; } = "answered";

        [Column("notes")]
        public string Notes { get; set; } = string.Empty;

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
