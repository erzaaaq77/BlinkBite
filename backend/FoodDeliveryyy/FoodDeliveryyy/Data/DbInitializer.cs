using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Identity;
using System;
using System.Linq;

namespace FoodDeliveryyy.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            context.Database.EnsureCreated();

            if (!context.Users.Any())
            {
                var user = new User
                {
                    UserName = "admin",
                    Email = "admin@example.com"
                };

                context.Users.Add(user);
                context.SaveChanges();
            }

            if (!context.Restaurants.Any())
            {
                // Get the admin user to assign as owner of the seeded restaurants
                var adminUser = context.Users.FirstOrDefault(u => u.UserName == "admin");
                if (adminUser == null)
                {
                    return; // nothing to attach restaurants to
                }

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
                context.SaveChanges();
            }
        }
    }
}