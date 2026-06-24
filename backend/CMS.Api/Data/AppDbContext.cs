using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Transportation> Transportations => Set<Transportation>();
    public DbSet<Fuel> Fuels => Set<Fuel>();
    public DbSet<FuelLog> FuelLogs => Set<FuelLog>();
    public DbSet<DozerLog> DozerLogs => Set<DozerLog>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<SalarySetup> SalarySetups => Set<SalarySetup>();
    public DbSet<MonthlySalary> MonthlySalaries => Set<MonthlySalary>();
    public DbSet<SalaryPayment> SalaryPayments => Set<SalaryPayment>();
    public DbSet<SalaryDetail> SalaryDetails => Set<SalaryDetail>();
    public DbSet<ProjectExpense> ProjectExpenses => Set<ProjectExpense>();
    public DbSet<ProjectWage> ProjectWages => Set<ProjectWage>();
    public DbSet<GovernmentOffice> GovernmentOffices => Set<GovernmentOffice>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasQueryFilter(u => !u.IsDeleted);

            entity.HasIndex(u => u.Username).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();

            entity.HasOne(u => u.Role)
                  .WithMany()
                  .HasForeignKey(u => u.RoleId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(u => u.AssignedVehicle)
                  .WithMany()
                  .HasForeignKey(u => u.VehicleId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(u => u.CreatedBy)
                  .WithMany()
                  .HasForeignKey(u => u.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(u => u.UpdatedBy)
                  .WithMany()
                  .HasForeignKey(u => u.UpdatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(u => u.DeletedBy)
                  .WithMany()
                  .HasForeignKey(u => u.DeletedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<FuelLog>(entity =>
        {
            entity.HasQueryFilter(l => !l.IsDeleted);
            entity.HasOne(l => l.Driver).WithMany().HasForeignKey(l => l.DriverId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(l => l.Vehicle).WithMany().HasForeignKey(l => l.VehicleId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(l => l.FuelType).WithMany().HasForeignKey(l => l.FuelTypeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(l => l.CreatedBy).WithMany().HasForeignKey(l => l.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(l => l.UpdatedBy).WithMany().HasForeignKey(l => l.UpdatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(l => l.DeletedBy).WithMany().HasForeignKey(l => l.DeletedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Fuel>(entity =>
        {
            entity.HasQueryFilter(f => !f.IsDeleted);
            entity.HasOne(f => f.CreatedBy).WithMany().HasForeignKey(f => f.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(f => f.UpdatedBy).WithMany().HasForeignKey(f => f.UpdatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(f => f.DeletedBy).WithMany().HasForeignKey(f => f.DeletedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<DozerLog>(entity =>
        {
            entity.HasQueryFilter(d => !d.IsDeleted);
            entity.HasOne(d => d.Driver).WithMany().HasForeignKey(d => d.DriverId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(d => d.Vehicle).WithMany().HasForeignKey(d => d.VehicleId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(d => d.Project).WithMany().HasForeignKey(d => d.ProjectId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(d => d.CreatedBy).WithMany().HasForeignKey(d => d.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(d => d.UpdatedBy).WithMany().HasForeignKey(d => d.UpdatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(d => d.DeletedBy).WithMany().HasForeignKey(d => d.DeletedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Transportation>(entity =>
        {
            entity.HasQueryFilter(t => !t.IsDeleted);
            entity.HasOne(t => t.TransportedBy).WithMany().HasForeignKey(t => t.TransportedById).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(t => t.Vehicle).WithMany().HasForeignKey(t => t.VehicleId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(t => t.Material).WithMany().HasForeignKey(t => t.MaterialId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(t => t.Vendor).WithMany().HasForeignKey(t => t.VendorId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(t => t.Project).WithMany().HasForeignKey(t => t.ProjectId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(t => t.CreatedBy).WithMany().HasForeignKey(t => t.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(t => t.UpdatedBy).WithMany().HasForeignKey(t => t.UpdatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(t => t.DeletedBy).WithMany().HasForeignKey(t => t.DeletedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.HasQueryFilter(v => !v.IsDeleted);
            entity.HasOne(v => v.CreatedBy).WithMany().HasForeignKey(v => v.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(v => v.UpdatedBy).WithMany().HasForeignKey(v => v.UpdatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(v => v.DeletedBy).WithMany().HasForeignKey(v => v.DeletedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasQueryFilter(p => !p.IsDeleted);
            entity.HasOne(p => p.CreatedBy).WithMany().HasForeignKey(p => p.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(p => p.UpdatedBy).WithMany().HasForeignKey(p => p.UpdatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(p => p.DeletedBy).WithMany().HasForeignKey(p => p.DeletedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(p => p.IssuedOffice).WithMany().HasForeignKey(p => p.IssuedOfficeId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Material>(entity =>
        {
            entity.HasQueryFilter(m => !m.IsDeleted);

            entity.HasOne(m => m.CreatedBy)
                  .WithMany()
                  .HasForeignKey(m => m.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(m => m.UpdatedBy)
                  .WithMany()
                  .HasForeignKey(m => m.UpdatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(m => m.DeletedBy)
                  .WithMany()
                  .HasForeignKey(m => m.DeletedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasQueryFilter(r => !r.IsDeleted);
            entity.HasOne(r => r.CreatedBy).WithMany().HasForeignKey(r => r.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(r => r.UpdatedBy).WithMany().HasForeignKey(r => r.UpdatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(r => r.DeletedBy).WithMany().HasForeignKey(r => r.DeletedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasQueryFilter(p => !p.IsDeleted);
            entity.HasIndex(p => p.Name).IsUnique();
            entity.HasOne(p => p.CreatedBy).WithMany().HasForeignKey(p => p.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(p => p.UpdatedBy).WithMany().HasForeignKey(p => p.UpdatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(p => p.DeletedBy).WithMany().HasForeignKey(p => p.DeletedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasIndex(rp => new { rp.RoleId, rp.PermissionId }).IsUnique();
            entity.HasOne(rp => rp.Role).WithMany().HasForeignKey(rp => rp.RoleId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(rp => rp.Permission).WithMany().HasForeignKey(rp => rp.PermissionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasQueryFilter(v => !v.IsDeleted);
            entity.HasIndex(v => v.NumberPlate).IsUnique();
            entity.Property(v => v.Type).HasConversion<string>();

            entity.HasOne(v => v.CreatedBy)
                  .WithMany()
                  .HasForeignKey(v => v.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(v => v.UpdatedBy)
                  .WithMany()
                  .HasForeignKey(v => v.UpdatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(v => v.DeletedBy)
                  .WithMany()
                  .HasForeignKey(v => v.DeletedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<MonthlySalary>(entity =>
        {
            entity.HasQueryFilter(m => !m.IsDeleted);
            entity.HasIndex(m => new { m.UserId, m.Month, m.Year }).IsUnique();

            entity.HasOne(m => m.User)
                  .WithMany()
                  .HasForeignKey(m => m.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.CreatedBy)
                  .WithMany()
                  .HasForeignKey(m => m.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(m => m.UpdatedBy)
                  .WithMany()
                  .HasForeignKey(m => m.UpdatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(m => m.DeletedBy)
                  .WithMany()
                  .HasForeignKey(m => m.DeletedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SalaryPayment>(entity =>
        {
            entity.HasQueryFilter(p => !p.IsDeleted);

            entity.HasOne(p => p.User)
                  .WithMany()
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.CreatedBy)
                  .WithMany()
                  .HasForeignKey(p => p.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.UpdatedBy)
                  .WithMany()
                  .HasForeignKey(p => p.UpdatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.DeletedBy)
                  .WithMany()
                  .HasForeignKey(p => p.DeletedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SalaryDetail>(entity =>
        {
            entity.HasIndex(d => d.UserId).IsUnique();

            entity.HasOne(d => d.User)
                  .WithMany()
                  .HasForeignKey(d => d.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProjectWage>(entity =>
        {
            entity.HasQueryFilter(w => !w.IsDeleted);
            entity.HasOne(w => w.Project).WithMany().HasForeignKey(w => w.ProjectId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(w => w.CreatedBy).WithMany().HasForeignKey(w => w.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(w => w.UpdatedBy).WithMany().HasForeignKey(w => w.UpdatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(w => w.DeletedBy).WithMany().HasForeignKey(w => w.DeletedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ProjectExpense>(entity =>
        {
            entity.HasQueryFilter(e => !e.IsDeleted);
            entity.HasOne(e => e.Project).WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Material).WithMany().HasForeignKey(e => e.MaterialId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Vendor).WithMany().HasForeignKey(e => e.VendorId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.CreatedBy).WithMany().HasForeignKey(e => e.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.UpdatedBy).WithMany().HasForeignKey(e => e.UpdatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.DeletedBy).WithMany().HasForeignKey(e => e.DeletedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SalarySetup>(entity =>
        {
            entity.HasQueryFilter(s => !s.IsDeleted);
            entity.HasIndex(s => s.UserId).IsUnique();

            entity.HasOne(s => s.User)
                  .WithMany()
                  .HasForeignKey(s => s.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(s => s.CreatedBy)
                  .WithMany()
                  .HasForeignKey(s => s.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(s => s.UpdatedBy)
                  .WithMany()
                  .HasForeignKey(s => s.UpdatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(s => s.DeletedBy)
                  .WithMany()
                  .HasForeignKey(s => s.DeletedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<GovernmentOffice>(entity =>
        {
            entity.HasQueryFilter(o => !o.IsDeleted);
            entity.HasOne(o => o.CreatedBy).WithMany().HasForeignKey(o => o.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(o => o.UpdatedBy).WithMany().HasForeignKey(o => o.UpdatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(o => o.DeletedBy).WithMany().HasForeignKey(o => o.DeletedById).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
