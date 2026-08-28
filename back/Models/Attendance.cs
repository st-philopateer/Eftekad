using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("attendance")]
    public class Attendance
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("serviceName")]
        public string ServiceName { get; set; } = string.Empty;

        [Column("className")]
        public string ClassName { get; set; } = string.Empty;

        [Column("stageName")]
        public string StageName { get; set; } = string.Empty;

        [Column("date")]
        public string Date { get; set; } = string.Empty;

        [Column("recordsJson")]
        public string RecordsJson { get; set; } = "{}"; // Serialized JSON dictionary of member attendance records

        [Column("serviceYear")]
        public string ServiceYear { get; set; } = "2026";

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
