using Microsoft.EntityFrameworkCore;
using Eftekad.Backend.Models;

namespace Eftekad.Backend.Data
{
    public class EftekadDbContext : DbContext
    {
        public EftekadDbContext(DbContextOptions<EftekadDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Makhdoom> Makhdomeen { get; set; } = null!;
        public DbSet<ServiceTree> ServiceTrees { get; set; } = null!;
        public DbSet<Attendance> Attendances { get; set; } = null!;
        public DbSet<Visitation> Visitations { get; set; } = null!;
        public DbSet<EvaluationTemplate> EvaluationTemplates { get; set; } = null!;
        public DbSet<ServantEvaluation> ServantEvaluations { get; set; } = null!;
        public DbSet<LessonPreparation> LessonPreparations { get; set; } = null!;
        public DbSet<PreparationSubmission> PreparationSubmissions { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<Job> Jobs { get; set; } = null!;
        public DbSet<StageList> StageLists { get; set; } = null!;
        public DbSet<ServiceYear> ServiceYears { get; set; } = null!;
        public DbSet<SystemMeta> SystemMetas { get; set; } = null!;
        public DbSet<PhilopateerRequest> PhilopateerRequests { get; set; } = null!;
        public DbSet<PhilopateerRule> PhilopateerRules { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Indexes & Constraints
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<Makhdoom>()
                .HasIndex(m => new { m.ServiceYear, m.Osra, m.Stage, m.Fasl });

            modelBuilder.Entity<Makhdoom>()
                .HasIndex(m => new { m.AssignedServant, m.ServiceYear });

            modelBuilder.Entity<Attendance>()
                .HasIndex(a => new { a.ServiceName, a.ClassName, a.Date });

            modelBuilder.Entity<ServantEvaluation>()
                .HasIndex(e => new { e.ServantUsername, e.TemplateId, e.WeekDate });
        }
    }
}
