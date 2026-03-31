using System;
using System.Linq;
using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Identity;
using FoodDeliveryyy.Models.Enums;
using Microsoft.EntityFrameworkCore;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        Console.WriteLine("INITIALIZER RUNNING");
        context.Database.Migrate();

        Console.WriteLine("Users count: " + context.Users.Count());
        Console.WriteLine("Restaurants count: " + context.Restaurants.Count());

        var adminUser = context.Users.FirstOrDefault(u => u.UserName == "admin");
        Console.WriteLine(adminUser == null ? "ADMIN IS NULL ❌" : "ADMIN EXISTS ✅");

        if (adminUser == null)
        {
            adminUser = new User
            {
                UserName = "admin",
                Email = "admin@example.com"
            };

            context.Users.Add(adminUser);
            context.SaveChanges();

            Console.WriteLine("Admin user created ✅");
        }

        var seedRestaurants = new Restaurant[]
        {
            new Restaurant {
                Emertimi = "SushiCo",
                Pershkrimi = "SuchiCo – Fresh sushi...",
                Telefoni = "+383 49 000 000",
                Email = "info@sushicokosova.com",
                Logo = "",
                OrariHapjes = new TimeOnly(10,0),
                OrariMbylljes = new TimeOnly(0,0),
                Rating = 4.5m,
                Statusi = RestaurantStatus.Active,
                UserId = adminUser.Id
            },
            new Restaurant {
                Emertimi = "BurgerKing",
                Pershkrimi = "Flame-grilled burgers...",
                Telefoni = "+383 49 000 000",
                Email = "info@burgerking.com",
                Logo = "",
                OrariHapjes = new TimeOnly(10,0),
                OrariMbylljes = new TimeOnly(0,0),
                Rating = 4.5m,
                Statusi = RestaurantStatus.Active,
                UserId = adminUser.Id
            },
            new Restaurant {
                Emertimi = "Pasta Fasta",
                Pershkrimi = "Delicious pasta",
                Telefoni = "+383 49 111 000",
                Email = "info@pastafasta.com",
                Logo = "",
                OrariHapjes = new TimeOnly(10, 0),
                OrariMbylljes = new TimeOnly(0, 0),
                Rating = 4.5m,
                Statusi = RestaurantStatus.Active,
                UserId = adminUser.Id
            },
            new Restaurant {
                Emertimi = "Proper Pizza",
                Pershkrimi = "Fresh pizza ",
                Telefoni = "+383 49 000 100",
                Email = "info@properpizaaks.com",
                Logo = "",
                OrariHapjes = new TimeOnly(10, 0),
                OrariMbylljes = new TimeOnly(0, 0),
                Rating = 4.5m,
                Statusi = RestaurantStatus.Active,
                UserId = adminUser.Id
            },
            new Restaurant {
                Emertimi = "KFC",
                Pershkrimi = "Fameous fastfood",
                Telefoni = "+383 49 222 000",
                Email = "info@kfc-ks.com",
                Logo = "",
                OrariHapjes = new TimeOnly(10, 0),
                OrariMbylljes = new TimeOnly(0, 0),
                Rating = 4.5m,
                Statusi = RestaurantStatus.Active,
                UserId = adminUser.Id
            },
            new Restaurant {
                Emertimi = "Green and Protein",
                Pershkrimi = "Delicous healthy meals",
                Telefoni = "+383 49 000 000",
                Email = "info@greenandproteinks.com",
                Logo = "",
                OrariHapjes = new TimeOnly(10, 0),
                OrariMbylljes = new TimeOnly(0, 0),
                Rating = 4.5m,
                Statusi = RestaurantStatus.Active,
                UserId = adminUser.Id
            },
            new Restaurant {
                Emertimi = "My Shawarma",
                Pershkrimi = "Your authentic Shawarma",
                Telefoni = "+383 49 000 000",
                Email = "info@myshawarma.com",
                Logo = "",
                OrariHapjes = new TimeOnly(10, 0),
                OrariMbylljes = new TimeOnly(0, 0),
                Rating = 4.5m,
                Statusi = RestaurantStatus.Active,
                UserId = adminUser.Id
            },
            new Restaurant {
                Emertimi = "Heavy Hit",
                Pershkrimi = "Flame-grilled burgers...",
                Telefoni = "+383 49 000 000",
                Email = "info@heavyhit-ks.com",
                Logo = "",
                OrariHapjes = new TimeOnly(10, 0),
                OrariMbylljes = new TimeOnly(0, 0),
                Rating = 4.5m,
                Statusi = RestaurantStatus.Active,
                UserId = adminUser.Id
            },
            new Restaurant {
                Emertimi = "Popeyes",
                Pershkrimi = "Flame-grilled burgers...",
                Telefoni = "+383 49 000 000",
                Email = "info@popeyes.com",
                Logo = "",
                OrariHapjes = new TimeOnly(10, 0),
                OrariMbylljes = new TimeOnly(0, 0),
                Rating = 4.5m,
                Statusi = RestaurantStatus.Active,
                UserId = adminUser.Id
            },
            new Restaurant {
                Emertimi = "Agusholli",
                Pershkrimi = "Sweet sweets!",
                Telefoni = "+383 49 000 000",
                Email = "info@burgerking.com",
                Logo = "",
                OrariHapjes = new TimeOnly(10, 0),
                OrariMbylljes = new TimeOnly(0, 0),
                Rating = 4.5m,
                Statusi = RestaurantStatus.Active,
                UserId = adminUser.Id
            },
            new Restaurant {
                Emertimi = "Saray Sweets",
                Pershkrimi = "Baklava and much more!",
                Telefoni = "+383 49 000 000",
                Email = "info@burgerking.com",
                Logo = "",
                OrariHapjes = new TimeOnly(10, 0),
                OrariMbylljes = new TimeOnly(0, 0),
                Rating = 4.5m,
                Statusi = RestaurantStatus.Active,
                UserId = adminUser.Id
            }
        };

        var toAdd = seedRestaurants
            .Where(r => !context.Restaurants.Any(db => db.Emertimi == r.Emertimi || db.Email == r.Email))
            .ToArray();

        if (toAdd.Any())
        {
            context.Restaurants.AddRange(toAdd);
            context.SaveChanges();
            Console.WriteLine($"Inserted {toAdd.Length} restaurants ✅");
        }
        else
        {
            Console.WriteLine("No new restaurants to insert.");
        }
    }
}