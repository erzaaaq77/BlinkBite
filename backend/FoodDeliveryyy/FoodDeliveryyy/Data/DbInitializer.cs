using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace FoodDeliveryyy.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(AppDbContext context, UserManager<User> userManager)
        {
            // apply any pending migrations
            await context.Database.MigrateAsync();

            // create admin user via UserManager so Identity fields/password hashing are handled
            if (!await userManager.Users.AnyAsync())
            {
                var admin = new User
                {
                    UserName = "admin",
                    Email = "admin@example.com",
                    EmailConfirmed = true
                };

                // create with a default password (change in production)
                await userManager.CreateAsync(admin, "Admin@1234");
            }

            if (!await context.Restaurants.AnyAsync())
            {
                var adminUser = await userManager.FindByNameAsync("admin");
                if (adminUser == null) return;

                var restaurants = new Restaurant[]
                {
                    new Restaurant {
                        Emertimi = "SushiCo",
                        Pershkrimi = "SuchiCo – Fresh, creative sushi made fast, for sushi lovers on the go.",
                        Telefoni = "+383 49 000 000",
                        Email = "info@sushicokosova.com",
                        Logo = "",
                        OrariHapjes = new TimeOnly(10, 0),
                        OrariMbylljes = new TimeOnly(0, 0),
                        Rating = 4.5m,
                        Statusi = Models.Enums.RestaurantStatus.Active,
                        UserId = adminUser.Id
                    },
                    new Restaurant {
                        Emertimi = "BurgerKing",
                        Pershkrimi = "BurgerKing – Flame-grilled burgers and tasty fast food, served quick.",
                        Telefoni = "+383 49 000 000",
                        Email = "info@sushicokosova.com",
                        Logo = "",
                        OrariHapjes = new TimeOnly(10, 0),
                        OrariMbylljes = new TimeOnly(0, 0),
                        Rating = 4.5m,
                        Statusi = Models.Enums.RestaurantStatus.Active,
                        UserId = adminUser.Id
                    }
                };

                context.Restaurants.AddRange(restaurants);
                await context.SaveChangesAsync();
            }
        }
    }
}
