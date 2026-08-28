using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("makhdomeen")]
    public class Makhdoom
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("gender")]
        public string Gender { get; set; } = "male";

        [Column("osra")]
        public string Osra { get; set; } = string.Empty;

        [Column("stage")]
        public string Stage { get; set; } = string.Empty;

        [Column("fasl")]
        public string Fasl { get; set; } = string.Empty;

        [Column("phone")]
        public string Phone { get; set; } = string.Empty;

        [Column("address")]
        public string Address { get; set; } = string.Empty;

        [Column("area")]
        public string Area { get; set; } = string.Empty;

        [Column("street")]
        public string Street { get; set; } = string.Empty;

        [Column("building")]
        public string Building { get; set; } = string.Empty;

        [Column("floor")]
        public string Floor { get; set; } = string.Empty;

        [Column("apartment")]
        public string Apartment { get; set; } = string.Empty;

        [Column("notes")]
        public string Notes { get; set; } = string.Empty;

        [Column("serviceYear")]
        public string ServiceYear { get; set; } = "2026";

        [Column("status")]
        public string Status { get; set; } = "active";

        [Column("assignedServant")]
        public string? AssignedServant { get; set; }

        [Column("code")]
        public string Code { get; set; } = string.Empty;

        [Column("timestamp")]
        public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");

        [Column("birthDate")]
        public string BirthDate { get; set; } = string.Empty;

        [Column("pendingPromotionFrom")]
        public string? PendingPromotionFrom { get; set; }

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
