using Microsoft.EntityFrameworkCore;
using Samator.CylinderTracker.Api.Entities;

namespace Samator.CylinderTracker.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Cylinder> Cylinders => Set<Cylinder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cylinder>(entity =>
        {
            entity.HasIndex(c => c.SerialNumber).IsUnique();
            entity.Property(c => c.SerialNumber).IsRequired().HasMaxLength(10);
            entity.Property(c => c.GasType).IsRequired().HasMaxLength(20);
            entity.Property(c => c.Status).IsRequired().HasMaxLength(20);
            entity.Property(c => c.CustomerName).HasMaxLength(120);
        });
    }
}
