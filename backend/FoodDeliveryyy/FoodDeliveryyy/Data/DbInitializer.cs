using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Identity;
using FoodDeliveryyy.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context, UserManager<User> userManager)
    {
        Console.WriteLine("INITIALIZER RUNNING");

        try
        {
            Console.WriteLine("Applying migrations...");
            await context.Database.MigrateAsync();
            Console.WriteLine("Migrations applied");

            try
            {
                var conn = context.Database.GetDbConnection();
                Console.WriteLine($"DB Connection: {conn.DataSource} | Database: {conn.Database}");
            }
            catch { }

            Console.WriteLine("Users count: " + await context.Users.CountAsync());
            Console.WriteLine("Restaurants count: " + await context.Restaurants.CountAsync());
        }
        catch (Exception ex)
        {
            Console.WriteLine("Exception during migration/initialization: " + ex.Message);
            Console.WriteLine(ex.StackTrace);
            throw;
        }

        try
        {
            if (!await userManager.Users.AnyAsync())
            {
                var admin = new User
                {
                    UserName = "admin",
                    Email = "admin@example.com",
                    EmailConfirmed = true
                };

                var createResult = await userManager.CreateAsync(admin, "Admin@1234");
                if (createResult.Succeeded)
                {
                    Console.WriteLine("Admin user created");
                }
                else
                {
                    Console.WriteLine("Failed to create admin user:");
                    foreach (var err in createResult.Errors)
                    {
                        Console.WriteLine($" - {err.Code}: {err.Description}");
                    }
                }
            }

            var adminUser = await userManager.FindByNameAsync("admin");
            if (adminUser == null)
            {
                Console.WriteLine("Admin user not found.");
                return;
            }
            if (!context.Restaurants.Any())
            {
                var seedRestaurants = new Restaurant[]
                    {
               new Restaurant { Emertimi="SushiCo", Pershkrimi="SuchiCo – Fresh sushi...", Telefoni="+383 49 000 000", Email="info@sushicokosova.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Sushi" },
               new Restaurant { Emertimi="BurgerKing", Pershkrimi="Flame-grilled burgers...", Telefoni="+383 49 000 000", Email="info@burgerking.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Fast Food" },
               new Restaurant { Emertimi="Pasta Fasta", Pershkrimi="Delicious pasta", Telefoni="+383 49 111 000", Email="info@pastafasta.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Italian" },
               new Restaurant { Emertimi="Proper Pizza", Pershkrimi="Fresh pizza", Telefoni="+383 49 000 100", Email="info@properpizaaks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Pizza" },
               new Restaurant { Emertimi="KFC", Pershkrimi="Fameous fastfood", Telefoni="+383 49 222 000", Email="info@kfc-ks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Fast Food" },
               new Restaurant { Emertimi="Green and Protein", Pershkrimi="Delicous healthy meals", Telefoni="+383 49 000 000", Email="info@greenandproteinks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Healthy" },
               new Restaurant { Emertimi="My Shawarma", Pershkrimi="Your authentic Shawarma", Telefoni="+383 49 000 000", Email="info@myshawarma.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Middle Eastern" },
               new Restaurant { Emertimi="Heavy Hit", Pershkrimi="Flame-grilled burgers...", Telefoni="+383 49 000 000", Email="info@heavyhit-ks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Fast Food" },
               new Restaurant { Emertimi="Popeyes", Pershkrimi="Flame-grilled burgers...", Telefoni="+383 49 000 000", Email="info@popeyes.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Fast Food" },
               new Restaurant { Emertimi="Agusholli", Pershkrimi="Sweet sweets!", Telefoni="+383 49 000 000", Email="info@agushollisweets.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Dessert" },
               new Restaurant { Emertimi="Saray Sweets", Pershkrimi="Baklava and much more!", Telefoni="+383 49 000 000", Email="info@saraysweets.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Dessert" },
               new Restaurant {Emertimi="Capvin 13", Pershkrimi="Delicious burgers and more!", Telefoni="+383 49 000 000", Email="info@capvin13.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Fast Food" },
               new Restaurant {Emertimi="Fika Eatery", Pershkrimi="Healthy and delicious meals!", Telefoni="+383 49 000 000", Email="info@fikaeatery", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Healthy" },
               new Restaurant {Emertimi="Mulliri", Pershkrimi="Traditional food with a modern twist!", Telefoni="+383 49 000 000", Email="info@mullirivjeter.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Dessert" },
               new Restaurant {Emertimi="Gjiks&Chiks", Pershkrimi="Delicious chicken dishes!", Telefoni="+383 49 000 000", Email="info@gjiksandchicks.com   ", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Fast Food" },
               new Restaurant {Emertimi="Smash Burger CO", Pershkrimi="Delicious burgers and more!", Telefoni="+383 49 000 000", Email="info@smashburgerco.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Fast Food" },
               new Restaurant {Emertimi="Buffalo Burgers", Pershkrimi="Delicious burgers and more!", Telefoni="+383 49 000 000", Email="info@buffaloburgers.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Fast Food" },
               new Restaurant {Emertimi="Hook Fish&Chips", Pershkrimi="Delicious fish and chips!", Telefoni="+383 49 000 000", Email="info@hookfishandchips.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Fast Food" },
               new Restaurant {Emertimi="Frix", Pershkrimi="Delicious fries and more!", Telefoni="+383 49 000 000", Email="info@frixks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id, Kategoria="Fast Food" }
                   };

                context.Restaurants.AddRange(seedRestaurants);
                await context.SaveChangesAsync();
            }


            if (!context.RestaurantAddresses.Any())
            {
                var allRestaurants = await context.Restaurants.ToListAsync();
                var addresses = new List<RestaurantAddress>();

                foreach (var restaurant in allRestaurants)
                {
                    if (restaurant.Emertimi == "SushiCo")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr.Luan Hardinaj, Pallati i Rinisë",
                            Qyteti = "Prishtinë",
                            Zona = "Qendër",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.661746791222185,
                            Longitude = 21.158287154546105
                        });
                    }
                    else if (restaurant.Emertimi == "BurgerKing")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "10000 Xhorxh Bush",
                            Qyteti = "Prishtinë",
                            Zona = "Qendër",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.659109100741,
                            Longitude = 21.16076295045968
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr. Ahmet Krasniqi",
                            Qyteti = "Prishtinë",
                            Zona = "Arbëri",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.65789276428699,
                            Longitude = 21.137545805949017
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Royal Mall, Rruga B",
                            Qyteti = "Prishtinë",
                            Zona = "Bregu i Diellit",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.65398360322043,
                            Longitude = 21.17741720185093

                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr Ukshin Hoti",
                            Qyteti = "Prishtinë",
                            Zona = "Pejton",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.658959200309425,
                            Longitude = 21.153938746030168
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Veternik",
                            Qyteti = "Prishtinë",
                            Zona = "Veternik",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.63158479775115,
                            Longitude = 21.147336142328303
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = " Albi Mall,Zona e Re Industriale",
                            Qyteti = "Prishtinë",
                            Zona = "Veternik",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.49437779850004,
                            Longitude = 21.49905185590765
                        });

                    }
                    else if (restaurant.Emertimi == "Pasta Fasta")
                    {

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr Hajdar Dushi, nr 12",
                            Qyteti = "Prishtinë",
                            Zona = "Qendër",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.66296333180196,
                            Longitude = 21.16216657486602
                        });

                    }

                    else if (restaurant.Emertimi == "Proper Pizza")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rrethi i Çagllavicës",
                            Qyteti = "Prishtinë",
                            Zona = "Çagllavicë",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.61653150647903,
                            Longitude = 21.143237890140693
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr Dervish Hima",
                            Qyteti = "Prishtinë",
                            Zona = "Emshir",
                            IsMain = false,
                            IsActive = false,
                            Latitude = 42.64307810037658,
                            Longitude = 21.1537448423283
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr Robert Doll",
                            Qyteti = "Prishtinë",
                            Zona = "Pejton",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.658414864338965,
                            Longitude = 21.15422995843568
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr Rexhep Luci",
                            Qyteti = "Prishtinë",
                            Zona = "Qendër",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.66564959695687,
                            Longitude = 21.16275784811355
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr Hyzri Talla",
                            Qyteti = "Prishtinë",
                            Zona = "Bregu i Diellit",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.65083595491357,
                            Longitude = 21.17363691301479
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr Haxhi Zeka",
                            Qyteti = "Prishtinë",
                            Zona = "Kolovicë",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.68119298858435,
                            Longitude = 21.1730895752945
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr Ferid Curri",
                            Qyteti = "Prishtinë",
                            Zona = "Arbëri",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.66095587439803,
                            Longitude = 21.141339771164148
                        });
                    }

                    else if (restaurant.Emertimi == "KFC")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Kompleksi ish-Ramiz Sadiku",
                            Qyteti = "Prishtinë",
                            Zona = "Pejton",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.65896126992145,
                            Longitude = 21.15304541164153
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Arbëri",
                            Qyteti = "Prishtinë",
                            Zona = "Arbëri",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.65798360243033,
                            Longitude = 21.137315769313222
                        });
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rruga B",
                            Qyteti = "Prishtinë",
                            Zona = "Bregu i Diellit",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.65473091732552,
                            Longitude = 21.176711840433374
                        });
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Qendra Tregtare Albi Mall",
                            Qyteti = "Prishtinë",
                            Zona = "Veternik",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.49437779850004,
                            Longitude = 21.49905185590765
                        });
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Veternik",
                            Qyteti = "Prishtinë",
                            Zona = "Veternik",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.63143479299327,
                            Longitude = 21.147303952369974
                        });
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Lagja Marigona",
                            Qyteti = "Prishtinë",
                            Zona = "Çagllavicë",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.62574929545231,
                            Longitude = 21.08312669701782

                        });
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Prishtina Mall, M2 (Prishtinë-Ferizaj)",
                            Qyteti = "Prishtinë",
                            Zona = "Çagllavicë",
                            IsMain = false,
                            IsActive = true,
                            Latitude = 42.564671220016166,
                            Longitude = 21.133386684904043

                        });
                    }

                    else if (restaurant.Emertimi == "Green and Protein")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Prime Residence, Tirana",
                            Qyteti = "Prishtinë",
                            Zona = "Lakrishtë",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.65607750726741,
                            Longitude = 21.151074513492457
                        });
                    }

                    else if (restaurant.Emertimi == "My Shawarma")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Sheshi Xhorxh Bush",
                            Qyteti = "Prishtinë",
                            Zona = "Qendër",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.657348936064004,
                            Longitude = 21.160636950520498
                        });
                    }

                    else if (restaurant.Emertimi == "Heavy Hit")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Albi Mall, Zona e re Industriale",
                            Qyteti = "Prishtinë",
                            Zona = "Veternik",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.49437779850004,
                            Longitude = 21.49905185590765
                        });

                    }
                    else if (restaurant.Emertimi == "Popeyes")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Prishtina Mall, M2 (Prishtinë-Ferizaj)",
                            Qyteti = "Prishtinë",
                            Zona = "Çagllavicë",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.564671220016166,
                            Longitude = 21.133386684904043
                        });
                    }

                    else if (restaurant.Emertimi == "Agusholli")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Santea",
                            Qyteti = "Prishtinë",
                            Zona = "Bill Clinton",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.65873016747044,
                            Longitude = 21.16484176685335
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "m9 Nënë Tereza",
                            Qyteti = "Prishtinë",
                            Zona = "M9 Fushë Kosovë",
                            IsMain = false,
                            IsActive = false,
                            Latitude = 42.641767568275036,
                            Longitude = 21.104080228199194
                        });
                    }
                    else if (restaurant.Emertimi == "Saray Sweets")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr Agim Ramadani",
                            Qyteti = "Prishtinë",
                            Zona = "Bulevardi Nënë Tereza",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.664535982621516,
                            Longitude = 21.165257275050763
                        });
                    }
                    else if (restaurant.Emertimi == "Capvin 13")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr Hyzri Talla",
                            Qyteti = "Prishtinë",
                            Zona = "Bregu i Diellit",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.65118040887382,
                            Longitude = 21.175045729087945
                        });

                    }

                    else if (restaurant.Emertimi == "Fika Eatery")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Bashkim Fehmiu 47",
                            Qyteti = "Prishtinë",
                            Zona = "Lakrishtë",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.657902432970126,
                            Longitude = 21.148112923535553
                        });
                    }
                    else if (restaurant.Emertimi == "Mulliri")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr  Luan Haradinaj",
                            Qyteti = "Prishtinë",
                            Zona = "Qendër",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.702782669836346,
                            Longitude = 21.179737619387176

                        });
                    }

                    else if (restaurant.Emertimi == "Gjiks&Chiks")
                    {
                        addresses.Add(new RestaurantAddress

                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rruga Vicianum",
                            Qyteti = "Prishtinë",
                            Zona = "Arbëri",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.66188248266638,
                            Longitude = 21.15364637875169
                        });

                    }

                    else if (restaurant.Emertimi == "Smash Burger CO")
                    {
                        addresses.Add(new RestaurantAddress

                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Ramiz Sadiku",
                            Qyteti = "Prishtinë",
                            Zona = "Pejton",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.65771040379635,
                            Longitude = 21.151608596550705
                        });

                    }
                    else if (restaurant.Emertimi == "Buffalo Burgers")
                    {
                        addresses.Add(new RestaurantAddress

                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rruga Muharrem Fejza",
                            Qyteti = "Prishtinë",
                            Zona = "Bregu i Diellit",
                            IsMain = false,
                            IsActive = false,
                            Latitude = 42.64612983216337,
                            Longitude = 21.17528867687603
                        });

                        addresses.Add(new RestaurantAddress

                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr Nurije Zeka",
                            Qyteti = "Prishtinë",
                            Zona = "Qendër",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.66145834096824,
                            Longitude = 21.16089913030993
                        });

                    }

                    else if (restaurant.Emertimi == "Hook Fish&Chips")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rruga Hajdar Dushi",
                            Qyteti = "Prishtinë",
                            Zona = "Qafa",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.663282501508405,
                            Longitude = 21.161554834572957
                        });
                    }


                    else if (restaurant.Emertimi == "Frix")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Albi Mall, Veternik",
                            Qyteti = "Prishtinë",
                            Zona = "Veternik",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.49437779850004,
                            Longitude = 21.49905185590765
                        });

                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Prishtina Mall, Zona Industriale",
                            Qyteti = "Prishtinë",
                            Zona = "Çagllavicë",
                            IsMain = true,
                            IsActive = true,
                            Latitude = 42.564671220016166,
                            Longitude = 21.133386684904043
                        });
                    }


                }


                context.RestaurantAddresses.AddRange(addresses);
                await context.SaveChangesAsync();

                Console.WriteLine("Addresses inserted");
            }



            if (!context.DeliveryDrivers.Any())
            {

                var seedDrivers = new DeliveryDrivers[]
            {
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 000 AA", Zona="Qendër", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 111 AA", Zona="Qendër", Statusi = DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 000 BB", Zona="Qendër", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 000 CC", Zona="Qendër", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 222 AA", Zona="Arbëri", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 333 AA", Zona="Arbëri", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 111 BB", Zona="Arbëri", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 111 CC", Zona="Arbëri", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 444 AA", Zona="Bregu i Diellit", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 222 CC", Zona="Bregu i Diellit", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 222 BB",Zona="Bregu i Diellit", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 666 AA", Zona="Bregu i Diellit", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 555 AA", Zona="Veternik", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 333 BB", Zona="Veternik", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 333 CC", Zona="Veternik", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 777 AA", Zona="Veternik", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 888 AA", Zona="Çagllavicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 444 BB", Zona="Çagllavicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 444 CC", Zona="Çagllavicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 999 AA", Zona="Çagllavicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 000 BB", Zona="Pejton", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 555 BB", Zona="Pejton",Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 555 CC", Zona="Pejton",  Statusi = DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 111 BB", Zona="Pejton",Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 222 BB", Zona="Lakrishtë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 666 BB", Zona="Lakrishtë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 666 CC", Zona="Lakrishtë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 333 BB", Zona="Lakrishtë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 444 BB", Zona="Qafa", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 777 BB", Zona="Qafa", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 777 CC", Zona="Qafa", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 555 BB", Zona="Emshir", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 888 BB", Zona="Emshir", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 888 CC", Zona="Emshir", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 666 BB", Zona="Emshir", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 777 BB", Zona="Bill Clinton", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 999 BB", Zona="Bill Clinton", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 999 CC", Zona="Bill Clinton", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 888 BB", Zona="Bill Clinton", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 999 BB", Zona="M9 Fushë Kosovë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 000 CC", Zona="M9 Fushë Kosovë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 000 CC", Zona="M9 Fushë Kosovë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 000 CC", Zona="M9 Fushë Kosovë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 111 CC", Zona="Bulevardi Nënë Tereza", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 111 CC", Zona="Bulevardi Nënë Tereza", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 111 CC", Zona="Bulevardi Nënë Tereza", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 222 CC", Zona="Bulevardi Nënë Tereza", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 333 CC", Zona="Kolovicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 222 CC", Zona="Kolovicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 222 CC", Zona="Kolovicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=adminUser.Id }

            };
                context.DeliveryDrivers.AddRange(seedDrivers);
                await context.SaveChangesAsync();
            }

        }

        catch (Exception ex)
        {
            Console.WriteLine("Exception during seeding: " + ex.Message);
            Console.WriteLine(ex.StackTrace);
        }
    }
}