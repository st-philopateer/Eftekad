using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("priestServices")]
    public class ServiceTree
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("type")]
        public string Type { get; set; } = "primary";

        [Column("color")]
        public string Color { get; set; } = "#c9a84c";

        [Column("serviceYear")]
        public string ServiceYear { get; set; } = "2026";

        [Column("serviceDay")]
        public string ServiceDay { get; set; } = "Friday";

        [Column("osrasJson")]
        public string OsrasJson { get; set; } = "[]"; // Serialized JSON array of nested osras/stages/classes

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
