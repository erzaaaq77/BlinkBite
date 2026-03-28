using Microsoft.EntityFrameworkCore;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;



namespace FoodDeliveryyy.Data
{


    public class AppDbContext : IdentityDbContext<User>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Restaurant> Restaurants { get; set; } = null!;
        public DbSet<MenuCategory> MenuCategories { get; set; } = null!;
        public DbSet<MenuItems> MenuItems { get; set; } = null!;
        public DbSet<Orders> Orders { get; set; } = null!;
        public DbSet<OrderItems> OrderItems { get; set; } = null!;
        public DbSet<DeliveryDrivers> DeliveryDrivers { get; set; } = null!;
        public DbSet<Deliveries> Deliveries { get; set; } = null!;
        public DbSet<Reviews> Reviews { get; set; } = null!;
        public DbSet<Addresses> Addresses { get; set; } = null!;
        public DbSet<Promotions> Promotions { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<Restaurant>()
            .Property(r => r.OrariHapjes).HasConversion(v => v.ToString(), v => TimeOnly.Parse(v));

            builder.Entity<Restaurant>()
            .Property(r => r.OrariMbylljes)
            .HasConversion(
             v => v.ToString(),
             v => TimeOnly.Parse(v));


            builder.Entity<Orders>()
               .Property(o => o.Statusi)
               .HasConversion<string>();

            builder.Entity<Deliveries>()
                .Property(d => d.Statusi)
                .HasConversion<string>();

            builder.Entity<DeliveryDrivers>()
                .Property(d => d.Statusi)
                .HasConversion<string>();

            builder.Entity<Promotions>()
                .Property(p => p.Statusi)
                .HasConversion<string>();

            builder.Entity<Restaurant>()
                .Property(r => r.Statusi)
                .HasConversion<string>();

            builder.Entity<Restaurant>()
             .HasIndex(r => r.Qyteti);

            builder.Entity<Orders>()
                .HasIndex(o => o.Statusi);

            builder.Entity<Orders>()
                .HasIndex(o => o.UserId);

            builder.Entity<Reviews>()
                .HasIndex(r => r.RestaurantId);

        }
    }
}


