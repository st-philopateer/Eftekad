using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("notifications")]
    public class Notification
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("type")]
        public string Type { get; set; } = "general";

        [Column("message")]
        public string Message { get; set; } = string.Empty;

        [Column("targetUser")]
        public string TargetUser { get; set; } = "all";

        [Column("sourceUser")]
        public string SourceUser { get; set; } = "system";

        [Column("read")]
        public bool Read { get; set; } = false;

        [Column("timestamp")]
        public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");

        [Column("serviceYear")]
        public string ServiceYear { get; set; } = "2026";

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
