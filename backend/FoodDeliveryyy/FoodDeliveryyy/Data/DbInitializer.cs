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
                Console.WriteLine("Admin user created ✅");
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
                Console.WriteLine("Merchant user created ✅");
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
                Console.WriteLine("Courier user created ✅");
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
                Console.WriteLine("Customer user created ✅");
            }
        }

        var seedRestaurants = new Restaurant[]
        {
               new Restaurant { Emertimi="Pasta Fasta", Pershkrimi="Delicious pasta", Telefoni="+383 49 111 000", Email="info@pastafasta.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Italian" },
new Restaurant { Emertimi="Proper Pizza", Pershkrimi="Fresh pizza", Telefoni="+383 49 000 100", Email="info@properpizaaks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Pizza" },
new Restaurant { Emertimi="KFC", Pershkrimi="Fameous fastfood", Telefoni="+383 49 222 000", Email="info@kfc-ks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Fast Food" },
new Restaurant { Emertimi="Green and Protein", Pershkrimi="Delicous healthy meals", Telefoni="+383 49 000 000", Email="info@greenandproteinks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Healthy" },
new Restaurant { Emertimi="My Shawarma", Pershkrimi="Your authentic Shawarma", Telefoni="+383 49 000 000", Email="info@myshawarma.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Shawarma" },
new Restaurant { Emertimi="Heavy Hit", Pershkrimi="Flame-grilled burgers...", Telefoni="+383 49 000 000", Email="info@heavyhit-ks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Burgers" },
new Restaurant { Emertimi="Popeyes", Pershkrimi="Flame-grilled burgers...", Telefoni="+383 49 000 000", Email="info@popeyes.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Burgers" },
new Restaurant { Emertimi="Agusholli", Pershkrimi="Sweet sweets!", Telefoni="+383 49 000 000", Email="info@agushollisweets.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Dessert" },
new Restaurant { Emertimi="Saray Sweets", Pershkrimi="Baklava and much more!", Telefoni="+383 49 000 000", Email="info@saraysweets.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Dessert" },
new Restaurant { Emertimi="Capvin 13", Pershkrimi="Delicious burgers and more", Telefoni="+383 49 000 000", Email="info@capvin13.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Burgers" },
new Restaurant { Emertimi="Fika Eatery", Pershkrimi="Healthy and delicious meals", Telefoni="+383 49 000 000", Email="info@fikaeatery.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Healthy" },
new Restaurant { Emertimi="Mulliri", Pershkrimi="Traditional food with a modern twist", Telefoni="+383 49 000 000", Email="info@mullirivjeter.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Traditional" },
new Restaurant { Emertimi="Gjiks&Chiks", Pershkrimi="Delicious chicken dishes!", Telefoni="+383 49 000 000", Email="info@gjiksandchiks.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Chicken" },
new Restaurant { Emertimi="Smash Burger CO", Pershkrimi="Delicious burgers and more", Telefoni="+383 49 000 000", Email="info@smashburgerco.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Burgers" },
new Restaurant { Emertimi="Buffalo Burgers", Pershkrimi="Delicious burgers and more", Telefoni="+383 49 000 000", Email="info@buffaloburgers.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Burgers" },
new Restaurant { Emertimi="Hook Fish&Chips", Pershkrimi="Delicious fish and chips!", Telefoni="+383 49 000 000", Email="info@hookfishandchips.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Seafood" },
new Restaurant { Emertimi="Frix", Pershkrimi="Delicious fries and more!", Telefoni="+383 49 000 000", Email="info@frixs.com", Logo="", OrariHapjes=new TimeOnly(10,0), OrariMbylljes=new TimeOnly(0,0), Rating=4.5m, Statusi=RestaurantStatus.Active, UserId=merchantUser.Id, Kategori="Fast Food" },
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
            new DeliveryDrivers { Automjeti="Scooter", Targa="AA 000 AA", Zona="Qendër", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 111 AA", Zona="Qendër", Statusi = DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 000 BB", Zona="Qendër", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 000 CC", Zona="Qendër", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 222 AA", Zona="Arbëri", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 333 AA", Zona="Arbëri", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id},
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 111 BB", Zona="Arbëri", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 111 CC", Zona="Arbëri", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 444 AA", Zona="Bregu i Diellit", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 222 CC", Zona="Bregu i Diellit", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 222 BB",Zona="Bregu i Diellit", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 666 AA", Zona="Bregu i Diellit", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 555 AA", Zona="Veternik", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 333 BB", Zona="Veternik", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id},
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 333 CC", Zona="Veternik", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id},
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 777 AA", Zona="Veternik", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id},
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 888 AA", Zona="Çagllavicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id},
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 444 BB", Zona="Çagllavicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id},
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 444 CC", Zona="Çagllavicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id},
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 999 AA", Zona="Çagllavicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 000 BB", Zona="Pejton", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id},
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 555 BB", Zona="Pejton",Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id},
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 555 CC", Zona="Pejton",  Statusi = DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id},
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 111 BB", Zona="Pejton",Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id},
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 222 BB", Zona="Lakrishtë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 666 BB", Zona="Lakrishtë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 666 CC", Zona="Lakrishtë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 333 BB", Zona="Lakrishtë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 444 BB", Zona="Qafa", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 777 BB", Zona="Qafa", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 777 CC", Zona="Qafa", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 555 BB", Zona="Emshir", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 888 BB", Zona="Emshir", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 888 CC", Zona="Emshir", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 666 BB", Zona="Emshir", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 777 BB", Zona="Bill Clinton", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 999 BB", Zona="Bill Clinton", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 999 CC", Zona="Bill Clinton", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 888 BB", Zona="Bill Clinton", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 999 BB", Zona="M9 Fushë Kosovë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 000 CC", Zona="M9 Fushë Kosovë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 000 CC", Zona="M9 Fushë Kosovë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 000 CC", Zona="M9 Fushë Kosovë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 111 CC", Zona="Bulevardi Nënë Tereza", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 111 CC", Zona="Bulevardi Nënë Tereza", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 111 CC", Zona="Bulevardi Nënë Tereza", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 222 CC", Zona="Bulevardi Nënë Tereza", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Scooter", Targa="AA 333 CC", Zona="Kolovicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Motorcycle", Targa="BB 222 CC", Zona="Kolovicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id },
                new DeliveryDrivers { Automjeti="Bicycle", Targa="CC 222 CC", Zona="Kolovicë", Statusi=DriverStatus.Available, Vlersimi=4.5m, UserId=courierUser.Id }
        };

        if (!context.DeliveryDrivers.Any())
        {
            context.DeliveryDrivers.AddRange(seedDrivers);
            await context.SaveChangesAsync();
            Console.WriteLine("Delivery drivers inserted");

        }
    }
}
