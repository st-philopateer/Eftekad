using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("meta")]
    public class SystemMeta
    {
        [Key]
        [Column("key")]
        public string Key { get; set; } = string.Empty;

        [Column("valueJson")]
        public string ValueJson { get; set; } = string.Empty; // Serialized JSON string of the dynamic value

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
