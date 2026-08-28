using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Eftekad.Backend.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("username")]
        public string Username { get; set; } = string.Empty;

        [Column("password")]
        public string Password { get; set; } = string.Empty;

        [Column("role")]
        public string Role { get; set; } = "servant";

        [Column("church")]
        public string Church { get; set; } = string.Empty;

        [Column("email")]
        public string Email { get; set; } = string.Empty;

        [Column("profilePic")]
        public string ProfilePic { get; set; } = string.Empty;

        [Column("status")]
        public string Status { get; set; } = "active";

        [Column("osra")]
        public string Osra { get; set; } = string.Empty;

        [Column("phone")]
        public string Phone { get; set; } = string.Empty;

        [Column("assignedStage")]
        public string AssignedStage { get; set; } = string.Empty;

        [Column("assignedClass")]
        public string AssignedClass { get; set; } = string.Empty;

        [Column("rolesListJson")]
        public string RolesListJson { get; set; } = "[]"; // Serialized JSON string array

        [Column("permissionsJson")]
        public string PermissionsJson { get; set; } = "{}"; // Serialized JSON object

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
