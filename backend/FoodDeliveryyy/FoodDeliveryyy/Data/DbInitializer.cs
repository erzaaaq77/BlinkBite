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
                    Console.WriteLine("Admin user created ✅");
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

            var seedRestaurants = new Restaurant[]
            {
                new Restaurant { Emertimi="SushiCo", Pershkrimi="SuchiCo – Fresh sushi...", Telefoni="+383 49 000 000", Email="info@sushicokosova.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id },
                new Restaurant { Emertimi="BurgerKing", Pershkrimi="Flame-grilled burgers...", Telefoni="+383 49 000 000", Email="info@burgerking.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id },
                new Restaurant { Emertimi="Pasta Fasta", Pershkrimi="Delicious pasta", Telefoni="+383 49 111 000", Email="info@pastafasta.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id },
                new Restaurant { Emertimi="Proper Pizza", Pershkrimi="Fresh pizza", Telefoni="+383 49 000 100", Email="info@properpizaaks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id },
                new Restaurant { Emertimi="KFC", Pershkrimi="Fameous fastfood", Telefoni="+383 49 222 000", Email="info@kfc-ks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id },
                new Restaurant { Emertimi="Green and Protein", Pershkrimi="Delicous healthy meals", Telefoni="+383 49 000 000", Email="info@greenandproteinks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id },
                new Restaurant { Emertimi="My Shawarma", Pershkrimi="Your authentic Shawarma", Telefoni="+383 49 000 000", Email="info@myshawarma.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id },
                new Restaurant { Emertimi="Heavy Hit", Pershkrimi="Flame-grilled burgers...", Telefoni="+383 49 000 000", Email="info@heavyhit-ks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id },
                new Restaurant { Emertimi="Popeyes", Pershkrimi="Flame-grilled burgers...", Telefoni="+383 49 000 000", Email="info@popeyes.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id },
                new Restaurant { Emertimi="Agusholli", Pershkrimi="Sweet sweets!", Telefoni="+383 49 000 000", Email="info@burgerking.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id },
                new Restaurant { Emertimi="Saray Sweets", Pershkrimi="Baklava and much more!", Telefoni="+383 49 000 000", Email="info@burgerking.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=adminUser.Id }
            };

            var toAdd = seedRestaurants
                .Where(r => !context.Restaurants.Any(db => db.Emertimi == r.Emertimi || db.Email == r.Email))
                .ToArray();

            if (toAdd.Any())
            {
                context.Restaurants.AddRange(toAdd);
                await context.SaveChangesAsync();

                Console.WriteLine($"Inserted {toAdd.Length} restaurants");

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
                                IsMain = true
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
                                IsMain = true
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Rr. Ahmet Krasniqi",
                                Qyteti = "Prishtinë",
                                Zona = "Arbëri",
                                IsMain = false
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Royal Mall, Rruga B",
                                Qyteti = "Prishtinë",
                                Zona = "Bregu i Diellit",
                                IsMain = false
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Rr Ukshin Hoti",
                                Qyteti = "Prishtinë",
                                Zona = "Pejton",
                                IsMain = false
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Veternik",
                                Qyteti = "Prishtinë",
                                Zona = "Veternik",
                                IsMain = false
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = " Albi Mall,Zona e Re Industriale",
                                Qyteti = "Prishtinë",
                                Zona = "Veternik",
                                IsMain = false
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
                                IsMain = true
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
                                IsMain = false
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Rr Dervish Hima",
                                Qyteti = "Prishtinë",
                                Zona = "Emshir",
                                IsMain = false
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Rr Robert Doll",
                                Qyteti = "Prishtinë",
                                Zona = "Pejton",
                                IsMain = false
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Rr Rexhep Luci",
                                Qyteti = "Prishtinë",
                                Zona = "Qendër",
                                IsMain = true
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Rr Hyzri Talla",
                                Qyteti = "Prishtinë",
                                Zona = "Bregu i Diellit",
                                IsMain = false
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Rr Haxhi Zeka",
                                Qyteti = "Prishtinë",
                                Zona = "Kolovicë",
                                IsMain = false
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Rr Ferid Curri",
                                Qyteti = "Prishtinë",
                                Zona = "Arbëri",
                                IsMain = false
                            });
                        }

                        else if (restaurant.Emertimi == "KFC")
                        {
                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Kompleksi ish-Ramiz Sadiku",
                                Qyteti = "Prishtinë",
                                Zona = "Qendër",
                                IsMain = true
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Arbëri",
                                Qyteti = "Prishtinë",
                                Zona = "Arbëri",
                                IsMain = false
                            });
                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Rruga B",
                                Qyteti = "Prishtinë",
                                Zona = "Bregu i Diellit",
                                IsMain = false
                            });
                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Qendra Tregtare Albi Mall",
                                Qyteti = "Prishtinë",
                                Zona = "Veternik",
                                IsMain = false
                            });
                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Veternik",
                                Qyteti = "Prishtinë",
                                Zona = "Veternik",
                                IsMain = false
                            });
                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Lagja Marigona",
                                Qyteti = "Prishtinë",
                                Zona = "Çagllavicë",
                                IsMain = false
                            });
                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Prishtina Mall, M2 (Prishtinë-Ferizaj)",
                                Qyteti = "Prishtinë",
                                Zona = "Çagllavicë",
                                IsMain = false
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
                                IsMain = true
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
                                IsMain = true
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
                                IsMain = true
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
                                IsMain = true
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
                                IsMain = true
                            });

                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "m9 Nënë Tereza",
                                Qyteti = "Prishtinë",
                                Zona = "M9 Fushë Kosovë",
                                IsMain = false
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
                                IsMain = true
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
                                IsMain = true
                            });

                        }

                        else if(restaurant.Emertimi=="Fika Eatery")
                        {
                            addresses.Add(new RestaurantAddress
                            {
                                RestaurantId = restaurant.Id,
                                Adresa = "Bashkim Fehmiu 47",
                                Qyteti = "Prishtinë",
                                Zona = "",
                                IsMain = true
                            });
                        }
                    }
                 

                    context.RestaurantAddresses.AddRange(addresses);
                    await context.SaveChangesAsync();

                    Console.WriteLine("Addresses inserted");
                }
            }
            else
            {
                Console.WriteLine("No new restaurants to insert.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Exception during seeding: " + ex.Message);
            Console.WriteLine(ex.StackTrace);
        }
    }
}