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
    public DbSet<Role> Roles => Set<Role>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
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
        });

        modelBuilder.Entity<FuelLog>(entity =>
        {
            entity.HasOne(l => l.Driver).WithMany().HasForeignKey(l => l.DriverId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(l => l.Vehicle).WithMany().HasForeignKey(l => l.VehicleId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(l => l.FuelType).WithMany().HasForeignKey(l => l.FuelTypeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(l => l.CreatedBy).WithMany().HasForeignKey(l => l.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(l => l.UpdatedBy).WithMany().HasForeignKey(l => l.UpdatedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Fuel>(entity =>
        {
            entity.HasOne(f => f.CreatedBy).WithMany().HasForeignKey(f => f.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(f => f.UpdatedBy).WithMany().HasForeignKey(f => f.UpdatedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Transportation>(entity =>
        {
            entity.HasOne(t => t.TransportedBy).WithMany().HasForeignKey(t => t.TransportedById).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(t => t.Vehicle).WithMany().HasForeignKey(t => t.VehicleId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(t => t.Material).WithMany().HasForeignKey(t => t.MaterialId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(t => t.Vendor).WithMany().HasForeignKey(t => t.VendorId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(t => t.Project).WithMany().HasForeignKey(t => t.ProjectId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(t => t.CreatedBy).WithMany().HasForeignKey(t => t.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(t => t.UpdatedBy).WithMany().HasForeignKey(t => t.UpdatedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.HasOne(v => v.CreatedBy).WithMany().HasForeignKey(v => v.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(v => v.UpdatedBy).WithMany().HasForeignKey(v => v.UpdatedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasOne(p => p.CreatedBy).WithMany().HasForeignKey(p => p.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(p => p.UpdatedBy).WithMany().HasForeignKey(p => p.UpdatedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Material>(entity =>
        {
            entity.HasOne(m => m.CreatedBy)
                  .WithMany()
                  .HasForeignKey(m => m.CreatedById)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(m => m.UpdatedBy)
                  .WithMany()
                  .HasForeignKey(m => m.UpdatedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasOne(r => r.CreatedBy).WithMany().HasForeignKey(r => r.CreatedById).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(r => r.UpdatedBy).WithMany().HasForeignKey(r => r.UpdatedById).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
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
        });
    }
}
