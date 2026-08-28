using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("philopateer_requests")]
    public class PhilopateerRequest
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("requestType")]
        public string RequestType { get; set; } = string.Empty;

        [Column("requesterUsername")]
        public string RequesterUsername { get; set; } = string.Empty;

        [Column("requesterName")]
        public string RequesterName { get; set; } = string.Empty;

        [Column("requesterOsra")]
        public string RequesterOsra { get; set; } = string.Empty;

        [Column("details")]
        public string Details { get; set; } = string.Empty;

        [Column("requiredDate")]
        public string RequiredDate { get; set; } = string.Empty;

        [Column("filesJson")]
        public string FilesJson { get; set; } = "[]"; // Serialized JSON string array of file names or paths

        [Column("photographyDetailsJson")]
        public string PhotographyDetailsJson { get; set; } = "{}"; // Serialized JSON of photography details object

        [Column("status")]
        public string Status { get; set; } = "pending";

        [Column("seen")]
        public bool Seen { get; set; } = false;

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
