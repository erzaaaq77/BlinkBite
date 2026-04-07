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
using System.Security.Cryptography;


public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context,
                                             UserManager<User> userManager,
                                             RoleManager<Role> roleManager)
    {
        Console.WriteLine("INITIALIZER RUNNING");

        await context.Database.MigrateAsync();

        var roles = new[] { "Admin", "Merchant", "Courier", "Customer" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new Role { Name = role, Description = $"{role} role" });
                Console.WriteLine($"Role {role} created ✅");
            }
        }

        var adminUser = await userManager.FindByNameAsync("admin");
        if (adminUser == null)
        {
            var admin = new User
            {
                UserName = "admin",
                Email = "admin@example.com",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(admin, "Admin@1234");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
                adminUser = admin;
                Console.WriteLine("Admin user created ");
            }
        }

        var merchantUser = await userManager.FindByNameAsync("merchant");
        if (merchantUser == null)
        {
            var merchant = new User
            {
                UserName = "merchant",
                Email = "merchant@example.com",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(merchant, "Merchant@1234");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(merchant, "Merchant");
                merchantUser = merchant;
                Console.WriteLine("Merchant user created ");
            }
        }

        var courierUser = await userManager.FindByNameAsync("courier");
        if (courierUser == null)
        {
            var courier = new User
            {
                UserName = "courier",
                Email = "courier@example.com",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(courier, "Courier@1234");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(courier, "Courier");
                courierUser = courier;
                Console.WriteLine("Courier user created ");
            }
        }

        var customerUser = await userManager.FindByNameAsync("customer");
        if (customerUser == null)
        {
            var customer = new User
            {
                UserName = "customer",
                Email = "customer@example.com",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(customer, "Customer@1234");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(customer, "Customer");
                customerUser = customer;
                Console.WriteLine("Customer user created ");
            }
        }

        var seedRestaurants = new Restaurant[]
        {
            new Restaurant { Emertimi="SushiCo", Pershkrimi="SuchiCo – Fresh sushi...", Telefoni="+383 49 000 000", Email="info@sushicokosova.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Sushi" },
            new Restaurant { Emertimi="Burger King", Pershkrimi="Flame-grilled burgers...", Telefoni="+383 49 000 000", Email="info@burgerking.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Fast Food" },

            new Restaurant { Emertimi = "Pasta Fasta", Pershkrimi = "Delicious pasta", Telefoni = "+383 49 111 000", Email = "info@pastafasta.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Italian" },
            new Restaurant { Emertimi = "Proper Pizza", Pershkrimi = "Fresh pizza", Telefoni = "+383 49 000 100", Email = "info@properpizaaks.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Pizza" },
            new Restaurant { Emertimi = "KFC", Pershkrimi = "Fameous fastfood", Telefoni = "+383 49 222 000", Email = "info@kfc-ks.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Fast Food" },
            new Restaurant { Emertimi = "Green and Protein", Pershkrimi = "Delicous healthy meals", Telefoni = "+383 49 000 000", Email = "info@greenandproteinks.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Healthy" },
            new Restaurant { Emertimi = "My Shawarma", Pershkrimi = "Your authentic Shawarma", Telefoni = "+383 49 000 000", Email = "info@myshawarma.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Shawarma" },
            new Restaurant { Emertimi = "Heavy Hit", Pershkrimi = "Flame-grilled burgers...", Telefoni = "+383 49 000 000", Email = "info@heavyhit-ks.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Burgers" },
            new Restaurant { Emertimi = "Popeyes", Pershkrimi = "Flame-grilled burgers...", Telefoni = "+383 49 000 000", Email = "info@popeyes.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Burgers" },
            new Restaurant { Emertimi = "Agusholli", Pershkrimi = "Sweet sweets!", Telefoni = "+383 49 000 000", Email = "info@agushollisweets.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Dessert" },
            new Restaurant { Emertimi = "Saray Sweets", Pershkrimi = "Baklava and much more!", Telefoni = "+383 49 000 000", Email = "info@saraysweets.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Dessert" },
            new Restaurant { Emertimi = "Capvin 13", Pershkrimi = "Delicious burgers and more", Telefoni = "+383 49 000 000", Email = "info@capvin13.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Burgers" },
            new Restaurant { Emertimi = "Fika Eatery", Pershkrimi = "Healthy and delicious meals", Telefoni = "+383 49 000 000", Email = "info@fikaeatery.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Healthy" },
            new Restaurant { Emertimi = "Mulliri", Pershkrimi = "Traditional food with a modern twist", Telefoni = "+383 49 000 000", Email = "info@mullirivjeter.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Traditional" },
            new Restaurant { Emertimi = "Gjiks&Chiks", Pershkrimi = "Delicious chicken dishes!", Telefoni = "+383 49 000 000", Email = "info@gjiksandchiks.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Chicken" },
            new Restaurant { Emertimi = "Smash Burger CO", Pershkrimi = "Delicious burgers and more", Telefoni = "+383 49 000 000", Email = "info@smashburgerco.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Burgers" },
            new Restaurant { Emertimi = "Buffalo Burgers", Pershkrimi = "Delicious burgers and more", Telefoni = "+383 49 000 000", Email = "info@buffaloburgers.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Burgers" },
            new Restaurant { Emertimi = "Hook Fish&Chips", Pershkrimi = "Delicious fish and chips!", Telefoni = "+383 49 000 000", Email = "info@hookfishandchips.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Seafood" },
            new Restaurant { Emertimi = "Frix", Pershkrimi = "Delicious fries and more!", Telefoni = "+383 49 000 000", Email = "info@frixs.com", Logo = "", OrariHapjes = new TimeOnly(10, 0), OrariMbylljes = new TimeOnly(0, 0), Rating = 4.5m, Statusi = RestaurantStatus.Active, UserId = merchantUser.Id, Kategori = "Fast Food" },
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
                    else if (restaurant.Emertimi == "Burger King")
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

                    else if (restaurant.Emertimi == "Fika Eatery")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Bashkim Fehmiu 47",
                            Qyteti = "Prishtinë",
                            Zona = "Lakrishtë",
                            IsMain = true
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
                            IsMain = true



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
                            IsMain = true
                        });

                    }

                    else if (restaurant.Emertimi == "Smach Burger CO")
                    {
                        addresses.Add(new RestaurantAddress

                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Ramiz Sadiku",
                            Qyteti = "Prishtinë",
                            Zona = "Pejton",
                            IsMain = true
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
                            IsMain = false
                        });

                        addresses.Add(new RestaurantAddress

                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Rr Nurije Zeka",
                            Qyteti = "Prishtinë",
                            Zona = "Qendër",
                            IsMain = true
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
                            IsMain = true
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
                            IsMain = true
                        });
                    }

                    else if (restaurant.Emertimi == "Frix")
                    {
                        addresses.Add(new RestaurantAddress
                        {
                            RestaurantId = restaurant.Id,
                            Adresa = "Prishtina Mall, Zona Industriale",
                            Qyteti = "Prishtinë",
                            Zona = "Çagllavicë",
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


        var seedDrivers = new DeliveryDrivers[]
        {
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 000 AA", Zona = "Qendër", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 111 AA", Zona = "Qendër", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 000 BB", Zona = "Qendër", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 000 CC", Zona = "Qendër", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 222 AA", Zona = "Arbëri", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 333 AA", Zona = "Arbëri", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 111 BB", Zona = "Arbëri", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 111 CC", Zona = "Arbëri", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 444 AA", Zona = "Bregu i Diellit", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 222 CC", Zona = "Bregu i Diellit", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 222 BB", Zona = "Bregu i Diellit", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 666 AA", Zona = "Bregu i Diellit", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 555 AA", Zona = "Veternik", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 333 BB", Zona = "Veternik", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 333 CC", Zona = "Veternik", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 777 AA", Zona = "Veternik", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 888 AA", Zona = "Çagllavicë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 444 BB", Zona = "Çagllavicë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 444 CC", Zona = "Çagllavicë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 999 AA", Zona = "Çagllavicë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 000 BB", Zona = "Pejton", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 555 BB", Zona = "Pejton", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 555 CC", Zona = "Pejton", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 111 BB", Zona = "Pejton", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 222 BB", Zona = "Lakrishtë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 666 BB", Zona = "Lakrishtë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 666 CC", Zona = "Lakrishtë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 333 BB", Zona = "Lakrishtë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 444 BB", Zona = "Qafa", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 777 BB", Zona = "Qafa", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 777 CC", Zona = "Qafa", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 555 BB", Zona = "Emshir", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 888 BB", Zona = "Emshir", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 888 CC", Zona = "Emshir", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 666 BB", Zona = "Emshir", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 777 BB", Zona = "Bill Clinton", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 999 BB", Zona = "Bill Clinton", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 999 CC", Zona = "Bill Clinton", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 888 BB", Zona = "Bill Clinton", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 999 BB", Zona = "M9 Fushë Kosovë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 000 CC", Zona = "M9 Fushë Kosovë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 000 CC", Zona = "M9 Fushë Kosovë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 000 CC", Zona = "M9 Fushë Kosovë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 111 CC", Zona = "Bulevardi Nënë Tereza", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 111 CC", Zona = "Bulevardi Nënë Tereza", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 111 CC", Zona = "Bulevardi Nënë Tereza", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 222 CC", Zona = "Bulevardi Nënë Tereza", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Scooter", Targa = "AA 333 CC", Zona = "Kolovicë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Motorcycle", Targa = "BB 222 CC", Zona = "Kolovicë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id },
            new DeliveryDrivers { Automjeti = "Bicycle", Targa = "CC 222 CC", Zona = "Kolovicë", Statusi = DriverStatus.Available, Vlersimi = 4.5m, UserId = courierUser.Id }
        };

        if (!context.DeliveryDrivers.Any())
        {
            context.DeliveryDrivers.AddRange(seedDrivers);
            await context.SaveChangesAsync();
            Console.WriteLine("Delivery drivers inserted");

        }
        if (!context.MenuCategories.Any())
        {
            var categories = new List<MenuCategory>();

            var burgerKing = context.Restaurants.FirstOrDefault(r => r.Emertimi == "Burger King");

            if (burgerKing != null)
            {
                var beef = new MenuCategory
                {
                    Emertimi = "Beef",
                    Pershkrimi = "Juicy flame-grilled beef burgers",
                    Renditja = 1,
                    RestaurantId = burgerKing.Id
                };

                var chicken = new MenuCategory
                {
                    Emertimi = "Chicken",
                    Pershkrimi = "Crispy, juicy chicken",
                    Renditja = 2,
                    RestaurantId = burgerKing.Id
                };
                var fish = new MenuCategory
                {
                    Emertimi = "Fish",
                    Pershkrimi = "Golden fried fish, tender and delicious ",
                    Renditja = 3,
                    RestaurantId = burgerKing.Id
                };
                var royal = new MenuCategory
                {
                    Emertimi = "Royal",
                    Pershkrimi = "Premium burgers with special sauces",
                    Renditja = 4,
                    RestaurantId = burgerKing.Id
                };
                var whopper = new MenuCategory
                {
                    Emertimi = "Whopper",
                    Pershkrimi = "The iconic flame-grilled Whopper burger",
                    Renditja = 5,
                    RestaurantId = burgerKing.Id
                };
                var salads = new MenuCategory
                {
                    Emertimi = "Salads",
                    Pershkrimi = "Fresh and crispy salads",
                    Renditja = 6,
                    RestaurantId = burgerKing.Id
                };
                var sides = new MenuCategory
                {
                    Emertimi = "Sides",
                    Pershkrimi = "Crispy fries, onion rings, and more",
                    Renditja = 7,
                    RestaurantId = burgerKing.Id
                };
                var desserts = new MenuCategory
                {
                    Emertimi = "Desserts",
                    Pershkrimi = "Sweet treats to finish your meal",
                    Renditja = 8,
                    RestaurantId = burgerKing.Id
                };
                var beverages = new MenuCategory
                {
                    Emertimi = "Beverages",
                    Pershkrimi = "Refreshing soft drinks and shakes",
                    Renditja = 9,
                    RestaurantId = burgerKing.Id
                };

                categories.AddRange(new[] { beef, chicken, fish, royal, whopper, salads, sides, desserts, beverages });
                context.MenuCategories.AddRange(categories);
                context.SaveChanges();


                var beefItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Single BBQ Beefacon",
                        Pershkrimi = "Grilled beef layered with beefacon and tangy BBQ sauce.",
                        Cmimi = 3.90m,
                        Foto = "menuitems/beefacon.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy, Mustard",
                        Kalori = 750,
                        CategoryId = beef.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Double BBQ Beefacon",
                        Pershkrimi = "Double beef, bacon, and smoky BBQ in every bite",
                        Cmimi = 6.50m,
                        Foto = "menuitems/doublebeefacon.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy, Mustard",
                        Kalori = 950,
                        CategoryId = beef.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Single Mushroom Swiss",
                        Pershkrimi = "Beef, mushrooms, and Swiss cheese.",
                        Cmimi = 5.90m,
                        Foto = "menuitems/mushroom.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 700,
                        CategoryId = beef.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Cheeseburger",
                        Pershkrimi = "Beef burger with cheese.",
                        Cmimi = 3.90m,
                        Foto = "menuitems/cheeseburger.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 650,
                        CategoryId = beef.Id
                    },

                    new MenuItems
                    {
                        Emertimi = "Double Cheeseburger",
                        Pershkrimi = " Double beef burger with cheese.",
                        Cmimi = 5.90m,
                        Foto = "menuitems/doublecheese.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 970,
                        CategoryId = beef.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Long Cheesy Onion Beef",
                        Pershkrimi = " Beef, cheese, and caramelized onions.",
                        Cmimi = 6.99m,
                        Foto = "menuitems/onionlong.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 750,
                        CategoryId = beef.Id
                    },

                };
                context.MenuItems.AddRange(beefItems);
                context.SaveChanges();

                var chickenItems = new List<MenuItems>
                {

                    new MenuItems
                    {
                        Emertimi = "Spicy Tendercrisp",
                        Pershkrimi = "Crispy chicken with a spicy kick.",
                        Cmimi = 4.50m,
                        Foto = "menuitems/spicychicken.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 575,
                        CategoryId = chicken.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "French Chicken",
                        Pershkrimi = "Crispy chicken with fresh toopings.",
                        Cmimi = 5.50m,
                        Foto = "menuitems/frenchchicken.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 565,
                        CategoryId = chicken.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "BK Chick'N Crisp",
                        Pershkrimi = "Crispy chicken fillet with fresh lettuce and savory sauce.",
                        Cmimi = 6.00m,
                        Foto = "menuitems/chickcrisp.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 570,
                        CategoryId = chicken.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Long Chicken",
                        Pershkrimi = "Crispy chicken with lettuce and mayo",
                        Cmimi = 6.00m,
                        Foto = "menuitems/longchicken.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 600,
                        CategoryId = chicken.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Tendergrill",
                        Pershkrimi = "Tender grilled chicken with fresh toppings.",
                        Cmimi = 6.00m,
                        Foto = "menuitems/tendergrill.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 450,
                        CategoryId = chicken.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Crispy Fried Chicken",
                        Pershkrimi = "Crispy fried chicken with fresh toppings",
                        Cmimi = 6.00m,
                        Foto = "menuitems/friedchicken.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 580,
                        CategoryId = chicken.Id
                    }

                };
                context.MenuItems.AddRange(chickenItems);
                context.SaveChanges();

                var fishItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Fish'N Crisp",
                        Pershkrimi = "Crispy fish with fresh toppings",
                        Cmimi = 4.00m,
                        Foto = "menuitems/fishh.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy,Fish",
                        Kalori = 500,
                        CategoryId = fish.Id
                    }
                };
                context.MenuItems.AddRange(fishItems);
                context.SaveChanges();

                var royalItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Supreme Nachos Deluxe Tendercrisp",
                        Pershkrimi = "Tendercrisp chicken with nachos, cheese, and sauce",
                        Cmimi = 6.50m,
                        Foto = "menuitems/supremenacho.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy,Chicken,Mustard",
                        Kalori = 750,
                        CategoryId = royal.Id

                    },
                    new MenuItems
                    {
                        Emertimi = "Triple Whopper Jr with Cheese",
                        Pershkrimi = "Triple beef patties with cheese and fresh toppings",
                        Cmimi = 6.50m,
                        Foto = "menuitems/triple.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 1100,
                        CategoryId = royal.Id

                    },
                    new MenuItems
                    {
                        Emertimi = "Signature Steakhouse Whopper®",
                        Pershkrimi = "Beef, bacon, cheese, and Steakhouse sauce.",
                        Cmimi = 6.50m,
                        Foto = "menuitems/signature.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy,Mustard,Pork",
                        Kalori = 900,
                        CategoryId = royal.Id

                    },


                };
                context.MenuItems.AddRange(royalItems);
                context.SaveChanges();

                var whopperItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Whopper",
                        Pershkrimi = "Flame-grilled beef with fresh toppings.",
                        Cmimi = 5.00m,
                        Foto = "menuitems/whopper.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 650,
                        CategoryId = whopper.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Whopper with Cheese",
                        Pershkrimi = "Beef patty with cheese and fresh toppings",
                        Cmimi = 5.90m,
                        Foto = "menuitems/whoppercheese.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 750,
                        CategoryId = whopper.Id
                    },

                    new MenuItems
                    {
                        Emertimi = "Whopper Jr",
                        Pershkrimi = "Beef patty with cheese and fresh toppings",
                        Cmimi = 5.00m,
                        Foto = "menuitems/whopperjr.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs, Soy",
                        Kalori = 750,
                        CategoryId = whopper.Id
                    }
                };
                context.MenuItems.AddRange(whopperItems);
                context.SaveChanges();


                var saladsItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Salad",
                        Pershkrimi = "Fresh greens with veggies and dressing",
                        Cmimi = 4.00m,
                        Foto = "menuitems/bkcsalad.jpg",
                        Disponueshme = true,
                        Alergjene = "Dairy",
                        Kalori = 150,
                        CategoryId = salads.Id
                    },

                     new MenuItems
                    {
                        Emertimi = "Mushroom Veggie Burger",
                        Pershkrimi = "Veggie patty with mushrooms and fresh toppings.",
                        Cmimi = 4.00m,
                        Foto = "menuitems/veggie.jpg",
                        Disponueshme = true,
                        Alergjene = "Dairy",
                        Kalori = 250,
                        CategoryId = salads.Id
                    }
                };

                context.MenuItems.AddRange(saladsItems);
                context.SaveChanges();

                var sidesItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Nuggets",
                        Pershkrimi = "Crispy golden nuggets.",
                        Cmimi = 3.00m,
                        Foto = "menuitems/nuggets.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten",
                        Kalori = 45,
                        CategoryId = sides.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Onion Rings",
                        Pershkrimi = "Crispy battered onion rings.",
                        Cmimi = 3.50m,
                        Foto = "menuitems/onionrings.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs",
                        Kalori = 350,
                        CategoryId = sides.Id
                    },
                    new MenuItems
                        {
                            Emertimi = "French Fries",
                            Pershkrimi = "Crispy golden fries.",
                            Cmimi = 2.50m,
                            Foto = "menuitems/frenchfries.jpg",
                            Disponueshme = true,
                            Alergjene = "Gluten",
                            Kalori = 300,
                            CategoryId = sides.Id
                        },
                    new MenuItems
                    {
                        Emertimi = "Mozzarella Sticks",
                        Pershkrimi = "Crispy fried mozzarella sticks.",
                        Cmimi = 4.00m,
                        Foto = "menuitems/mozzarella.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Dairy, Eggs",
                        Kalori = 400,
                        CategoryId = sides.Id
                    },
                        new MenuItems
                        {
                            Emertimi = "Cheese Fries",
                            Pershkrimi = "Fries topped with melted cheese.",
                            Cmimi = 3.50m,
                            Foto = "menuitems/cheesefries.jpg",
                            Disponueshme = true,
                            Alergjene = "Gluten, Dairy, Eggs",
                            Kalori = 450,
                            CategoryId = sides.Id
                        }
                };
                context.MenuItems.AddRange(sidesItems);
                context.SaveChanges();

                var dessertsItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "HERSHEY’S Sundae Pie",
                        Pershkrimi= "Chocolate sundae pie with HERSHEY’S® topping",
                        Cmimi = 3.00m,
                        Foto = "menuitems/sundae.jpg",
                        Disponueshme = true,
                        Alergjene = "Dairy, Gluten,Eggs,Nuts",
                        Kalori = 355,
                        CategoryId = desserts.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Vanilla Soft Serve",
                        Pershkrimi ="Vanilla soft-serve ice cream.",
                        Cmimi = 2.50m,
                        Foto = "menuitems/vanillaicecream.jpg",
                        Disponueshme = true,
                        Alergjene = "Dairy, Gluten,Eggs",
                        Kalori = 250,
                        CategoryId = desserts.Id
                    },
                     new MenuItems
                    {
                        Emertimi = "Affogato Sundae",
                        Pershkrimi ="Soft-serve ice cream with espresso and chocolate topping",
                        Cmimi = 3.00m,
                        Foto = "menuitems/affogato.png",
                        Disponueshme = true,
                        Alergjene = "Dairy, Gluten,Eggs",
                        Kalori = 300,
                        CategoryId = desserts.Id
                    }

                };
                context.MenuItems.AddRange(dessertsItems);
                context.SaveChanges();

                var beveragesItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Cold Soft Drink",
                        Pershkrimi = "Classic Coca-Cola,Sprite,Fanta....",
                        Cmimi = 1.50m,
                        Foto = "menuitems/coke.jpg",
                        Disponueshme = true,
                        Alergjene = "None",
                        Kalori = 150,
                        CategoryId = beverages.Id
                    },

                     new MenuItems
                    {
                        Emertimi = "Water",
                        Pershkrimi = "Water",
                        Cmimi = 1.00m,
                        Foto = "menuitems/water.jpg",
                        Disponueshme = true,
                        Alergjene = "None",
                        Kalori = 00,
                        CategoryId = beverages.Id
                    }
                };
                context.MenuItems.AddRange(beveragesItems);
                context.SaveChanges();
            }





            var categoriesSushi = new List<MenuCategory>();

            var sushico = context.Restaurants.FirstOrDefault(r => r.Emertimi == "SushiCo");

            if (sushico != null)
            {
                var appetizer = new MenuCategory
                {
                    Emertimi = "Appetizer",
                    Pershkrimi = "A variety of small dishes to awaken your appetite",
                    Renditja = 1,
                    RestaurantId = sushico.Id
                };

                var soup = new MenuCategory
                {
                    Emertimi = "Soup",
                    Pershkrimi = "Warm and comforting soups to start your meal",
                    Renditja = 2,
                    RestaurantId = sushico.Id
                };
                var dimsum = new MenuCategory
                {
                    Emertimi = "Dim Sum",
                    Pershkrimi = "Steamed or fried dumplings filled with delicious ingredients",
                    Renditja = 3,
                    RestaurantId = sushico.Id
                };
                var ramen = new MenuCategory
                {
                    Emertimi = "Ramen",
                    Pershkrimi = "Savory noodle soups with rich broths and toppings",
                    Renditja = 4,
                    RestaurantId = sushico.Id
                };
                var saladS = new MenuCategory
                {
                    Emertimi = "Salads",
                    Pershkrimi = "Fresh and vibrant salads with Asian-inspired flavors",
                    Renditja = 5,
                    RestaurantId = sushico.Id
                };

                var chickenS = new MenuCategory
                {
                    Emertimi = "Chicken",
                    Pershkrimi = "Tender chicken dishes with Asian flavors",
                    Renditja = 6,
                    RestaurantId = sushico.Id
                };
                var beefS = new MenuCategory
                {
                    Emertimi = "Beef",
                    Pershkrimi = "Savory beef dishes with Asian flavors",
                    Renditja = 7,
                    RestaurantId = sushico.Id
                };
                var seafoodS = new MenuCategory
                {
                    Emertimi = "Seafood",
                    Pershkrimi = "Fresh seafood dishes with Asian flavors",
                    Renditja = 8,
                    RestaurantId = sushico.Id
                };
                var noodlesS = new MenuCategory
                {
                    Emertimi = "Noodles",
                    Pershkrimi = "Delicious noodle dishes with Asian flavors",
                    Renditja = 9,
                    RestaurantId = sushico.Id
                };

                var rice = new MenuCategory
                {
                    Emertimi = "Rice",
                    Pershkrimi = "Flavorful rice dishes with Asian flavors",
                    Renditja = 10,
                    RestaurantId = sushico.Id
                };
                var donburi = new MenuCategory
                {
                    Emertimi = "Donburi",
                    Pershkrimi = "Hearty rice bowls topped with savory ingredients",
                    Renditja = 11,
                    RestaurantId = sushico.Id
                };
                var sushirolls = new MenuCategory
                {
                    Emertimi = "Sushi Rolls",
                    Pershkrimi = "Fresh and creative sushi rolls with various fillings",
                    Renditja = 12,
                    RestaurantId = sushico.Id
                };
                var nigiri = new MenuCategory
                {
                    Emertimi = "Nigiri",
                    Pershkrimi = "Sliced raw fish atop small mounds of rice",
                    Renditja = 13,
                    RestaurantId = sushico.Id
                };
                var setmenu = new MenuCategory
                {
                    Emertimi = "Set Menu",
                    Pershkrimi = "Curated combinations of dishes for a complete meal",
                    Renditja = 14,
                    RestaurantId = sushico.Id
                };
                var sashimi = new MenuCategory
                {
                    Emertimi = "Sashimi",
                    Pershkrimi = "Thinly sliced raw fish served without rice",
                    Renditja = 15,
                    RestaurantId = sushico.Id
                };
                var specialrolls = new MenuCategory
                {
                    Emertimi = "Special Rolls",
                    Pershkrimi = "Unique and creative sushi rolls with special ingredients",
                    Renditja = 16,
                    RestaurantId = sushico.Id
                };
                var cookedrolls = new MenuCategory
                {
                    Emertimi = "Cooked Rolls",
                    Pershkrimi = "Warm and flavorful rolls for a rich sushi experience",
                    Renditja = 17,
                    RestaurantId = sushico.Id
                };
                var beveragesS = new MenuCategory
                {
                    Emertimi = "Cold Drinks",
                    Pershkrimi = "Fresh dinks",
                    Renditja = 18,
                    RestaurantId = sushico.Id
                };
                var extra = new MenuCategory
                {
                    Emertimi = "Extra",
                    Pershkrimi = "Extra sauces",
                    Renditja = 19,
                    RestaurantId = sushico.Id
                };
                var alcohol = new MenuCategory
                {
                    Emertimi = "Alcohol",
                    Pershkrimi = "Alcohol drinks",
                    Renditja = 20,
                    RestaurantId = sushico.Id
                };
                categoriesSushi.AddRange(new[] { appetizer, soup, dimsum, ramen, saladS, chickenS, beefS, seafoodS, noodlesS, rice, donburi,sushirolls,nigiri,setmenu,sashimi,specialrolls,cookedrolls,beveragesS,extra,alcohol });
                context.MenuCategories.AddRange(categoriesSushi);
                context.SaveChanges();

                var appetizerItems = new List<MenuItems>
                {
                   new MenuItems{
                   Emertimi = "Edamame with Parmesan",
                   Pershkrimi = "Steamed edamame tossed with Parmesan cheese and a hint of garlic.",
                   Cmimi=5.30m,
                   Foto="sushico/edamame.jpg",
                   Disponueshme = true,
                   Alergjene="Soy, Dairy",
                   Kalori=200,
                   CategoryId= appetizer.Id
                   },
                   new MenuItems{
                   Emertimi = "Chicken Katsu Finger",
                   Pershkrimi = "Crispy Japanese-style chicken fingers.",
                   Cmimi=6.80m,
                   Foto="sushico/katsu.jpg",
                   Disponueshme = true,
                   Alergjene="Gluten,Eggs,Soy, Dairy",
                   Kalori=420,
                   CategoryId= appetizer.Id
                   },
                    new MenuItems{
                   Emertimi = " Veal Tataki with Truffle",
                   Pershkrimi = "Lightly seared veal slices served with aromatic truffle sauce.",
                   Cmimi=11.80m,
                   Foto="sushico/tataki.jpg",
                   Disponueshme = true,
                   Alergjene="Gluten,Eggs,Soy, Dairy",
                   Kalori=350,
                   CategoryId= appetizer.Id
                   },
                   new MenuItems{
                   Emertimi = " Japanese Potato",
                   Pershkrimi = "Crunchy potatoes with a delicate umami flavor.",
                   Cmimi=5.70m,
                   Foto="sushico/japanesepotato.jpg",
                   Disponueshme = true,
                   Alergjene="Gluten,Soy, Dairy",
                   Kalori=300,
                   CategoryId= appetizer.Id
                   },
                   new MenuItems{
                   Emertimi = "Shrimp Bomb",
                   Pershkrimi = "Crispy shrimp tossed in a creamy spicy sauce",
                   Cmimi=8.20m,
                   Foto="sushico/shrimpbomb.jpg",
                   Disponueshme = true,
                   Alergjene="Shellfish,Eggs,Gluten,Soy",
                   Kalori=400,
                   CategoryId= appetizer.Id
                   },
                    new MenuItems{
                   Emertimi = "Salmon Carpaccio",
                   Pershkrimi = "Crispy shrimp tossed in a creamy spicy sauce",
                   Cmimi=8.20m,
                   Foto="sushico/carpaccio.jpg",
                   Disponueshme = true,
                   Alergjene="Gluten,Soy,Dairy",
                   Kalori=250,
                   CategoryId= appetizer.Id
                   },
                     new MenuItems{
                   Emertimi = "Tempura Mix",
                   Pershkrimi = "Crispy shrimp and seasonal vegetables in light tempura batter, served with dipping sauce.",
                   Cmimi=14.50m,
                   Foto="sushico/tempura.jpg",
                   Disponueshme = true,
                   Alergjene="Soy,Fish",
                   Kalori=400,
                   CategoryId= appetizer.Id
                   },
                       new MenuItems{
                   Emertimi = "Salmon Tataki",
                   Pershkrimi = "Crispy shrimp and seasonal vegetables in light tempura batter, served with dipping sauce.",
                   Cmimi=9.10m,
                   Foto="sushico/salmontataki.jpg",
                   Disponueshme = true,
                   Alergjene="Soy,Fish,Sesame,Gluten",
                   Kalori=300,
                   CategoryId= appetizer.Id
                   }
                };
                context.MenuItems.AddRange(appetizerItems);
                context.SaveChanges();

                var soupItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Wonton Soup",
                        Pershkrimi = "Delicate wontons in a savory broth with vegetables and a hint of ginger.",
                        Cmimi = 4.50m,
                        Foto = "sushico/wonton.jpg",
                        Disponueshme = true,
                        Alergjene = "Soy, Gluten,Eggs,Shellfish",
                        Kalori = 250,
                        CategoryId = soup.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Ramen Soup",
                        Pershkrimi = "Savory noodle soup with rich broth, tender noodles, and various toppings.",
                        Cmimi = 6.00m,
                        Foto = "sushico/ramen.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Soy, Eggs",
                        Kalori = 550,
                        CategoryId = soup.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Miso Soup",
                        Pershkrimi = "Traditional Japanese miso broth with tofu, seaweed, and spring onions.",
                        Cmimi = 4.50m,
                        Foto = "sushico/miso.jpg",
                        Disponueshme = true,
                        Alergjene = "Fish, Soy",
                        Kalori = 80,
                        CategoryId = soup.Id
                    },
                     new MenuItems
                    {
                        Emertimi = "Sea Food Soup",
                        Pershkrimi = "A hearty broth with a mix of fresh seafood, vegetables, and aromatic herbs.",
                        Cmimi = 7.90m,
                        Foto = "sushico/seafoods.jpg",
                        Disponueshme = true,
                        Alergjene = "Crustaceans, Soy,Mollusks",
                        Kalori = 400,
                        CategoryId = soup.Id
                    }
                };
                context.MenuItems.AddRange(soupItems);
                context.SaveChanges();

                var dimsumItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Spring Roll",
                        Pershkrimi = "Crispy golden spring rolls filled with fresh vegetables and served with a tangy dipping sauce.",
                        Cmimi = 5.50m,
                        Foto = "sushico/springroll.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Soy, Eggs",
                        Kalori = 150,
                        CategoryId = dimsum.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Korean Wonton",
                        Pershkrimi = "Crispy Korean-style wontons filled with seasoned meat and vegetables, served with a savory dipping sauce.",
                        Cmimi = 6.60m,
                        Foto = "sushico/koreanwonton.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Soy, Eggs, Shellfish",
                        Kalori = 200,
                        CategoryId = dimsum.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Shrimp gyoza",
                        Pershkrimi = "Delicate dumplings filled with fresh shrimp and vegetables, pan-seared and served with a savory dipping sauce.",
                        Cmimi = 6.60m,
                        Foto = "sushico/gyoza.jpg",
                        Disponueshme = true,
                        Alergjene = "Crustaceans,Gluten, Soy, Eggs",
                        Kalori = 190,
                        CategoryId = dimsum.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Duck Meat Bun",
                        Pershkrimi = "Soft steamed bun filled with flavorful, tender duck meat.",
                        Cmimi = 6.60m,
                        Foto = "sushico/duckbun.jpg",
                        Disponueshme = true,
                        Alergjene = "Crustaceans,Gluten, Soy, Eggs",
                        Kalori = 190,
                        CategoryId = dimsum.Id
                    },
                      new MenuItems
                    {
                        Emertimi = "Steamed Beef Dumplings",
                        Pershkrimi = "Tender beef dumplings steamed to perfection, served with a savory dipping sauce.",
                        Cmimi = 6.10m,
                        Foto = "sushico/dumpling.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Soy, Eggs",
                        Kalori = 250,
                        CategoryId = dimsum.Id
                    },
                      new MenuItems
                    {
                        Emertimi = "Chicken Bun",
                        Pershkrimi = "Soft steamed bun filled with tender, seasoned chicken.",
                        Cmimi = 5.00m,
                        Foto = "sushico/chickenbun.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Soy, Eggs",
                        Kalori = 250,
                        CategoryId = dimsum.Id
                    },

                };
                context.MenuItems.AddRange(dimsumItems);
                context.SaveChanges();

                var ramenItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Wonton Ramen",
                        Pershkrimi = "Savory ramen noodles in a rich broth, served with delicate wontons and vegetables.",
                        Cmimi = 10.90m,
                        Foto = "sushico/wontonramen.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Soy, Eggs,Fish",
                        Kalori = 400,
                        CategoryId = dimsum.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Chicken Ramen",
                        Pershkrimi = "Noodles in a flavorful chicken broth with tender chicken, vegetables, and a soft-boiled egg.",
                        Cmimi = 9.70m,
                        Foto = "sushico/chickenramen.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Soy, Eggs,Fish",
                        Kalori = 400,
                        CategoryId = dimsum.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Shrimp Ramen",
                        Pershkrimi = "Noodles in a savory broth with succulent shrimp, vegetables, and a soft-boiled egg.",
                        Cmimi = 12.00m,
                        Foto = "sushico/shrimpramen.jpg",
                        Disponueshme = true,
                        Alergjene = "Crustaceans,Gluten, Soy, Eggs",
                        Kalori = 450,
                        CategoryId = dimsum.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Beef Ramen",
                        Pershkrimi = "Ramen noodles served in a rich beef broth with tender slices of beef, vegetables, and a soft-boiled egg.",
                        Cmimi = 10.90m,
                        Foto = "sushico/beeframen.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Soy, Eggs",
                        Kalori = 490,
                        CategoryId = dimsum.Id
                    }
                };
                context.MenuItems.AddRange(ramenItems);
                context.SaveChanges();

                var saladItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Quinoa Salad with Salmon",
                        Pershkrimi = "A healthy quinoa salad topped with fresh salmon, mixed greens, and a light citrus dressing.",
                        Cmimi = 10.90m,
                        Foto = "sushico/quinoa.jpg",
                        Disponueshme = true,
                        Alergjene = "Soy,Fish,Nuts",
                        Kalori = 300,
                        CategoryId = saladS.Id
                     },
                    new MenuItems
                    {
                        Emertimi = "Spicy Cabbage Salad",
                        Pershkrimi = "Crunchy cabbage tossed in a zesty, spicy dressing for a bold and refreshing flavor.",
                        Cmimi =3.30m,
                        Foto = "sushico/cabagge.jpg",
                        Disponueshme = true,
                        Alergjene = "Soy, Sesame",
                        Kalori = 120,
                        CategoryId = saladS.Id
                     },
                    new MenuItems
                    {
                        Emertimi = "Seafood Salad",
                        Pershkrimi = "Fresh mixed seafood with crisp greens, tossed in a light and tangy dressing.",
                        Cmimi = 6.00m,
                        Foto = "sushico/saefoodsalad.jpg",
                        Disponueshme = true,
                        Alergjene = "Soy, Gluten,Mollusks,Fish,Crustaceans",
                        Kalori = 250,
                        CategoryId = saladS.Id
                     },
                    new MenuItems
                    {
                        Emertimi = "Sashimi Salad",
                        Pershkrimi = "Fresh slices of raw fish served over mixed greens with a light citrus-soy dressing.",
                        Cmimi = 9.70m,
                        Foto = "sushico/sashimisalad.jpg",
                        Disponueshme = true,
                        Alergjene = "Soy, Gluten,Fish,Sesame",
                        Kalori = 250,
                        CategoryId = saladS.Id
                     },
                    new MenuItems
                    {
                        Emertimi = "Japanese-Style Kani Salad",
                        Pershkrimi = "Imitation crab mixed with fresh vegetables and a creamy, tangy Japanese-style dressing.",
                        Cmimi = 9.70m,
                        Foto = "sushico/kanisalad.jpg",
                        Disponueshme = true,
                        Alergjene = "Eggs,Soy,Crustaceans",
                        Kalori = 320,
                        CategoryId = saladS.Id
                     },
                    new MenuItems
                    {
                        Emertimi = "Kani & Cucumber Salad",
                        Pershkrimi = "Crisp cucumber and imitation crab tossed in a light, creamy dressing.",
                        Cmimi = 7.30m,
                        Foto = "sushico/kanicsalad.jpg",
                        Disponueshme = true,
                        Alergjene = "Sesame,Soy,Eggs,Crustaceans",
                        Kalori = 150,
                        CategoryId = saladS.Id
                     }
                 };
                context.MenuItems.AddRange(saladItems);
                context.SaveChanges();

                var chickenItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Chicken Katsu Bowl",
                        Pershkrimi = "Crispy breaded chicken served over steamed rice with vegetables and savory sauce.",
                        Cmimi = 7.20m,
                        Foto = "sushico/chickenkatsu.jpg",
                        Disponueshme = true,
                        Alergjene = "Soy, Gluten, Eggs,Sesame",
                        Kalori = 600,
                        CategoryId = chickenS.Id
                     },
                    new MenuItems
                    {
                        Emertimi = "Korean-Style Chicken Bulgogi",
                        Pershkrimi = "Tender chicken marinated in a sweet and savory Korean sauce, grilled to perfection and served with vegetables.",
                        Cmimi = 9.70m,
                        Foto = "sushico/bulgogi.jpg",
                        Disponueshme = true,
                        Alergjene = "Soy, Gluten, Eggs,Sesame",
                        Kalori = 450,
                        CategoryId = chickenS.Id
                     },
                    new MenuItems
                    {
                        Emertimi = "Chicken with Vegetables",
                        Pershkrimi = "Tender chicken stir-fried with fresh seasonal vegetables in a light savory sauce.",
                        Cmimi = 8.50m,
                        Foto = "sushico/vegetable.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten, Soy, Eggs",
                        Kalori = 400,
                        CategoryId = chickenS.Id
                     },
                    new MenuItems
                    {
                        Emertimi = "Chicken with Red Curry",
                        Pershkrimi = "Tender chicken cooked in a rich and aromatic red curry sauce with vegetables.",
                        Cmimi = 9.70m,
                        Foto = "sushico/currychicken.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten,Fish,Nuts",
                        Kalori = 450,
                        CategoryId = chickenS.Id
                     },
                    new MenuItems
                    {
                        Emertimi = "Sweet & Sour Chicken",
                        Pershkrimi = "Crispy chicken pieces tossed in a tangy and sweet sauce with bell peppers and pineapple.",
                        Cmimi = 9.10m,
                        Foto = "sushico/sweetsour.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten,Eggs,Soy,Sesame",
                        Kalori = 600,
                        CategoryId = chickenS.Id
                     },
                    new MenuItems
                    {
                        Emertimi = "Chicken Manchurian",
                        Pershkrimi = "Crispy chicken cooked in a savory and slightly spicy Indo-Chinese sauce with vegetables.",
                        Cmimi = 9.10m,
                        Foto = "sushico/manchurian.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten,Eggs,Soy,Sesame",
                        Kalori = 600,
                        CategoryId = chickenS.Id
                     }
                 };
                context.MenuItems.AddRange(chickenItems); 
                context.SaveChanges();

                var beefItems = new List<MenuItems>
                {
                    new MenuItems{
                       Emertimi = "Beef with Crispy Eggplant",
                        Pershkrimi = "Tender beef stir-fried with crispy eggplant in a savory, slightly sweet sauce.",
                        Cmimi = 12.60m,
                        Foto = "sushico/eggplantbeef.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten,Soy,Sesame",
                        Kalori = 600,
                        CategoryId = beefS.Id
                    },
                    new MenuItems{
                       Emertimi = "Korean-Style Beef Bulgogi",
                        Pershkrimi = "Tender beef marinated in a sweet and savory Korean sauce, grilled and served with vegetables",
                        Cmimi = 11.50m,
                        Foto = "sushico/beefbulgogi.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten,Soy,Sesame,Eggs",
                        Kalori = 600,
                        CategoryId = beefS.Id
                    },
                    new MenuItems{
                       Emertimi = "Beef with Green Peppers",
                        Pershkrimi = "Tender beef stir-fried with fresh green peppers in a savory sauce.",
                        Cmimi = 11.60m,
                        Foto = "sushico/beefgreen.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten,Soy,Sesame",
                        Kalori = 500,
                        CategoryId = beefS.Id
                    },
                    new MenuItems{
                       Emertimi = "Spicy Beef with Mushrooms",
                        Pershkrimi = "Tender beef stir-fried with mushrooms and spicy seasonings for a bold, flavorful dish.",
                        Cmimi = 12.10m,
                        Foto = "sushico/mushroombeeg.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten,Soy,Sesame",
                        Kalori = 500,
                        CategoryId = beefS.Id
                    },
                    new MenuItems{
                       Emertimi = "Thai-Style Beef with Chili & Basil",
                        Pershkrimi = "Tender beef stir-fried with fresh chili and aromatic basil in a savory Thai sauce.",
                        Cmimi = 12.60m,
                        Foto = "sushico/thaibeef.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten,Soy,Sesame",
                        Kalori = 500,
                        CategoryId = beefS.Id
                    },
                     new MenuItems{
                       Emertimi = "Beef with Black Garlic",
                        Pershkrimi = "Tender beef cooked with rich, aromatic black garlic in a savory sauce.",
                        Cmimi = 12.10m,
                        Foto = "sushico/beefgarlic.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten,Soy,Sesame",
                        Kalori = 550,
                        CategoryId = beefS.Id
                    }
                };
                context.MenuItems.AddRange(beefItems);
                context.SaveChanges();

                var seafoodItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                        Emertimi = "Beef with Black Garlic",
                        Pershkrimi = "Grilled salmon glazed with a sweet and savory teriyaki sauce, served with vegetables.",
                        Cmimi = 14.50m,
                        Foto = "sushico/salmonteryaki.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten,Soy,Sesame,Fish",
                        Kalori = 470,
                        CategoryId = seafoodS.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Beef with Black Garlic",
                        Pershkrimi = "Delicately steamed salmon served with a light, savory sauce.",
                        Cmimi = 13.40m,
                        Foto = "sushico/steamedsalmon.jpg",
                        Disponueshme = true,
                        Alergjene = "Gluten,Soy,Fish",
                        Kalori = 360,
                        CategoryId = seafoodS.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Spicy Calamari with Cashews",
                        Pershkrimi = "Crispy calamari stir-fried with spicy seasonings and crunchy cashews.",
                        Cmimi = 13.40m,
                        Foto = "sushico/spicycalamari.jpg",
                        Disponueshme = true,
                        Alergjene = "Mollusks,Nuts,Soy,Gluten",
                        Kalori = 450,
                        CategoryId = seafoodS.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Sweet & Sour Shrimp",
                        Pershkrimi = "Crispy shrimp tossed in a tangy and sweet sauce with vegetables",
                        Cmimi = 14.50m,
                        Foto = "sushico/ssshrimp.jpg",
                        Disponueshme = true,
                        Alergjene = "Crustaceans,Sesame,Soy,Gluten",
                        Kalori = 450,
                        CategoryId = seafoodS.Id
                    },
                    new MenuItems
                    {
                        Emertimi = "Shrimp with Cashews",
                        Pershkrimi = "Succulent shrimp stir-fried with crunchy cashews in a savory sauce.",
                        Cmimi = 14.50m,
                        Foto = "sushico/cashewsshrimp.jpg",
                        Disponueshme = true,
                        Alergjene = "Crustaceans,Sesame,Soy,Gluten,Nuts",
                        Kalori = 570,
                        CategoryId = seafoodS.Id
                    }
                   
                };
                context.MenuItems.AddRange(seafoodItems);
                context.SaveChanges();

                var noodleItems = new List<MenuItems>
                {
                    new MenuItems
                    {
                    Emertimi = "Udon with Shrimp & Black Garlic",
                        Pershkrimi = "Thick udon noodles stir-fried with shrimp and rich black garlic in a savory sauce",
                        Cmimi = 11.50m,
                        Foto = "sushico/shrimpgarlic.jpg",
                        Disponueshme = true,
                        Alergjene = "Crustaceans,Sesame,Soy,Gluten",
                        Kalori = 570,
                        CategoryId = noodlesS.Id
                    },
                    new MenuItems
                    {
                    Emertimi = "Udon with Chicken & Black Garlic",
                        Pershkrimi = "Thick udon noodles stir-fried with tender chicken and rich black garlic in a savory sauce.",
                        Cmimi = 11.50m,
                        Foto = "sushico/shrimpgarlic.jpg",
                        Disponueshme = true,
                        Alergjene = "Sesame,Soy,Gluten",
                        Kalori = 570,
                        CategoryId = noodlesS.Id
                    },
                    new MenuItems
                    {
                    Emertimi = "Plain Noodles",
                        Pershkrimi = "Simple stir-fried noodles with a light savory flavor.",
                        Cmimi = 5.50m,
                        Foto = "sushico/plainnoodles.jpg",
                        Disponueshme = true,
                        Alergjene = "Sesame,Soy,Gluten",
                        Kalori = 350,
                        CategoryId = noodlesS.Id
                    },
                    new MenuItems
                    {
                    Emertimi = "Korean-Style Chicken Bulgogi Udon",
                        Pershkrimi = "Thick udon noodles stir-fried with tender chicken in a sweet and savory Korean bulgogi sauce",
                        Cmimi = 9.10m,
                        Foto = "sushico/chickenudon.jpg",
                        Disponueshme = true,
                        Alergjene = "Sesame,Soy,Gluten",
                        Kalori = 560,
                        CategoryId = noodlesS.Id
                    },
                    new MenuItems
                    {
                    Emertimi = "Korean-Style Beef Bulgogi Udon",
                        Pershkrimi = "Thick udon noodles stir-fried with tender beef in a sweet and savory Korean bulgogi sauce.",
                        Cmimi = 10.40m,
                        Foto = "sushico/beefudon.jpg",
                        Disponueshme = true,
                        Alergjene = "Sesame,Soy,Gluten",
                        Kalori = 560,
                        CategoryId = noodlesS.Id
                    },
                    new MenuItems
                    {
                    Emertimi = "Vegetable Noodles",
                        Pershkrimi = "Stir-fried noodles with fresh seasonal vegetables in a light savory sauce.",
                        Cmimi = 10.40m,
                        Foto = "sushico/vegetablenoodle.jpg",
                        Disponueshme = true,
                        Alergjene = "Sesame,Soy,Gluten",
                        Kalori = 400,
                        CategoryId = noodlesS.Id
                    },
                    new MenuItems
                    {
                    Emertimi = "Chicken Noodles",
                        Pershkrimi = "Stir-fried noodles with tender chicken and fresh vegetables in a savory sauce.",
                        Cmimi = 10.40m,
                        Foto = "sushico/chickennoodle.jpg",
                        Disponueshme = true,
                        Alergjene = "Sesame,Soy,Gluten",
                        Kalori = 500,
                        CategoryId = noodlesS.Id
                    },
                    new MenuItems
                    {
                    Emertimi = "Beef Noodles",
                        Pershkrimi = "Stir-fried noodles with tender beef and fresh vegetables in a savory sauce.",
                        Cmimi =9.20m,
                        Foto = "sushico/beefnoodle.jpg",
                        Disponueshme = true,
                        Alergjene = "Sesame,Soy,Gluten",
                        Kalori = 500,
                        CategoryId = noodlesS.Id
                    },
                    new MenuItems
                    {
                    Emertimi = "Thai-Style Chicken Noodles",
                        Pershkrimi = "Stir-fried noodles with tender chicken, vegetables, and aromatic Thai spices.",
                        Cmimi =10.30m,
                        Foto = "sushico/thaichicken.jpg",
                        Disponueshme = true,
                        Alergjene = "Sesame,Soy,Gluten",
                        Kalori = 500,
                        CategoryId = noodlesS.Id
                    },
                    new MenuItems
                    {
                    Emertimi = "Thai-Style Beef Noodles",
                        Pershkrimi = "Stir-fried noodles with tender beef, vegetables, and aromatic Thai spices",
                        Cmimi =11.50m,
                        Foto = "sushico/beefthai.jpg",
                        Disponueshme = true,
                        Alergjene = "Sesame,Soy,Gluten",
                        Kalori = 500,
                        CategoryId = noodlesS.Id
                    },
                    new MenuItems
                    {
                    Emertimi = "Thai-Style Shrimp Noodles",
                        Pershkrimi = "Stir-fried noodles with succulent shrimp, vegetables, and aromatic Thai spices.",
                        Cmimi =12.60m,
                        Foto = "sushico/shrimpthai.jpg",
                        Disponueshme = true,
                        Alergjene = "Sesame,Soy,Gluten,Fish",
                        Kalori = 560,
                        CategoryId = noodlesS.Id
                    }
                };
                context.MenuItems.AddRange(noodleItems);
                context.SaveChanges();

                var riceItems = new List<MenuItems>
                {
                new MenuItems
                    {
                    Emertimi = "Steamed Rice",
                        Pershkrimi = "Fluffy, perfectly steamed white rice – a simple and versatile side.",
                        Cmimi =2.50m,
                        Foto = "sushico/rice.jpg",
                        Disponueshme = true,
                        Alergjene = "None",
                        Kalori = 200,
                        CategoryId = rice.Id
                   },
                new MenuItems
                    {
                    Emertimi = "Vegetable Rice",
                        Pershkrimi = "Fluffy steamed rice stir-fried with fresh seasonal vegetables.",
                        Cmimi =5.50m,
                        Foto = "sushico/vegetablerice.jpg",
                        Disponueshme = true,
                        Alergjene = "Soy,Gluten",
                        Kalori = 300,
                        CategoryId = rice.Id
                   },
                new MenuItems
                    {
                    Emertimi = "Curry Beef Rice",
                        Pershkrimi = "Steamed rice served with tender beef cooked in a flavorful curry sauce.",
                        Cmimi =7.50m,
                        Foto = "sushico/curryrice.jpg",
                        Disponueshme = true,
                        Alergjene = "Soy,Gluten,Sesame",
                        Kalori = 500,
                        CategoryId = rice.Id
                   },
                new MenuItems
                    {
                    Emertimi = "Thai-Style Pineapple Rice",
                        Pershkrimi = "Fragrant Thai-style fried rice with pineapple, vegetables, and a touch of spices.",
                        Cmimi =7.20m,
                        Foto = "sushico/thaiananas.jpg",
                        Disponueshme = true,
                        Alergjene = "Soy,Gluten,Eggs",
                        Kalori = 550,
                        CategoryId = rice.Id
                   },
                new MenuItems
                    {
                    Emertimi = "Shrimp Rice",
                        Pershkrimi = "Steamed or fried rice served with succulent shrimp and fresh vegetables.",
                        Cmimi =8.50m,
                        Foto = "sushico/shrimprice.jpg",
                        Disponueshme = true,
                        Alergjene = "Crustaceans,Soy,Gluten,Eggs",
                        Kalori = 550,
                        CategoryId = rice.Id
                   },
                };
                context.MenuItems.AddRange(riceItems);
                context.SaveChanges();
            }
            
        }
    }
}