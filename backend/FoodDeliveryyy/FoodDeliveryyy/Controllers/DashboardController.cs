using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FoodDeliveryyy.Models.Identity;
using FoodDeliveryyy.Models.Enums;

namespace FoodDeliveryyy.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public DashboardController(AppDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    [HttpGet("Admin")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> GetAdminDashboard()
    {
        var today = DateTime.Today;
        var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
        var startOfMonth = new DateTime(today.Year, today.Month, 1);

        var allUsers = await _context.Users.ToListAsync();
        var userRoles = await _context.UserRoles.ToListAsync();
        var roles = await _context.Roles.ToListAsync();

        var customerRoleId = roles.FirstOrDefault(r => r.Name == "Customer")?.Id;
        var merchantRoleId = roles.FirstOrDefault(r => r.Name == "Merchant")?.Id;
        var courierRoleId = roles.FirstOrDefault(r => r.Name == "Courier")?.Id;

        var customers = userRoles.Count(ur => ur.RoleId == customerRoleId);
        var merchants = userRoles.Count(ur => ur.RoleId == merchantRoleId);
        var couriers = userRoles.Count(ur => ur.RoleId == courierRoleId);

        var dashboard = new
        {
            Orders = new
            {
                Total = await _context.Orders.CountAsync(),
                Today = await _context.Orders.CountAsync(o => o.DataPorosis.Date == today),
                Pending = await _context.Orders.CountAsync(o => o.Statusi == OrderStatus.Pending),
                Delivered = await _context.Orders.CountAsync(o => o.Statusi == OrderStatus.Delivered),
                Cancelled = await _context.Orders.CountAsync(o => o.Statusi == OrderStatus.Cancelled)
            },
            Revenue = new
            {
                Today = await _context.Orders.Where(o => o.DataPorosis.Date == today).SumAsync(o => o.ShumaTotale),
                ThisMonth = await _context.Orders.Where(o => o.DataPorosis.Date >= startOfMonth).SumAsync(o => o.ShumaTotale),
                Total = await _context.Orders.SumAsync(o => o.ShumaTotale)
            },
            Users = new
            {
                Total = allUsers.Count(),
                Customers = customers,
                Merchants = merchants,
                Couriers = couriers,
                NewToday = await _context.Users.CountAsync(u => u.CreatedAt.Date == today)
            },
            Restaurants = new
            {
                Total = await _context.Restaurants.CountAsync(),
                Active = await _context.Restaurants.CountAsync(r => r.Statusi == RestaurantStatus.Active),
                Pending = await _context.Restaurants.CountAsync(r => r.Statusi == RestaurantStatus.Pending)
            },
            Reviews = new
            {
                AverageRating = await _context.Reviews.AverageAsync(r => r.Vlersimi),
                Total = await _context.Reviews.CountAsync(),
                Today = await _context.Reviews.CountAsync(r => r.DataKrijimit.Date == today)
            }
        };

        return Ok(dashboard);
    }

    [HttpGet("Merchant")]
    [Authorize(Roles = AppRoles.Merchant + "," + AppRoles.BranchManager)]
    public async Task<IActionResult> GetMerchantDashboard()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = AppRoles.Normalize(User.FindFirst(ClaimTypes.Role)?.Value);

        Restaurant? restaurant;
        List<dynamic> addresses;

        if (role == AppRoles.BranchManager)
        {
            var branchAddresses = await _context.RestaurantAddresses
                .Where(a => a.MerchantUserId == userId)
                .OrderByDescending(a => a.IsMain)
                .ThenByDescending(a => a.IsActive)
                .ThenBy(a => a.Qyteti)
                .ThenBy(a => a.Adresa)
                .Select(a => new
                {
                    id = a.Id,
                    restaurantId = a.RestaurantId,
                    merchantUserId = a.MerchantUserId,
                    adresa = a.Adresa,
                    qyteti = a.Qyteti,
                    zona = a.Zona,
                    isMain = a.IsMain,
                    isActive = a.IsActive,
                    latitude = a.Latitude,
                    longitude = a.Longitude
                })
                .ToListAsync();

            if (!branchAddresses.Any())
                return NotFound("No branch found for this branch manager");

            var restaurantId = branchAddresses[0].restaurantId;
            restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.Id == restaurantId);
            if (restaurant == null)
                return NotFound("No restaurant found for this branch manager");

            addresses = branchAddresses.Cast<dynamic>().ToList();
        }
        else
        {
            restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.UserId == userId);

            if (restaurant == null)
                return NotFound("No restaurant found for this merchant");

            var ownerAddresses = await _context.RestaurantAddresses
                .Where(a => a.RestaurantId == restaurant.Id)
                .OrderByDescending(a => a.IsMain)
                .ThenByDescending(a => a.IsActive)
                .ThenBy(a => a.Qyteti)
                .ThenBy(a => a.Adresa)
                .Select(a => new
                {
                    id = a.Id,
                    restaurantId = a.RestaurantId,
                    merchantUserId = a.MerchantUserId,
                    adresa = a.Adresa,
                    qyteti = a.Qyteti,
                    zona = a.Zona,
                    isMain = a.IsMain,
                    isActive = a.IsActive,
                    latitude = a.Latitude,
                    longitude = a.Longitude
                })
                .ToListAsync();

            addresses = ownerAddresses.Cast<dynamic>().ToList();
        }

        var today = DateTime.Today;
        var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
        var startOfMonth = new DateTime(today.Year, today.Month, 1);
        var addressIds = addresses.Select(a => (int)a.id).ToList();

        var scopedOrders = _context.Orders.AsQueryable();
        if (role == AppRoles.BranchManager)
        {
            scopedOrders = scopedOrders.Where(o => o.RestaurantAddressId.HasValue && addressIds.Contains(o.RestaurantAddressId.Value));
        }
        else
        {
            scopedOrders = scopedOrders.Where(o => o.RestaurantId == restaurant.Id);
        }

        var primaryAddressId = addresses.FirstOrDefault(a => (bool)(a?.isMain ?? false))?.id
            ?? addresses.FirstOrDefault()?.id;

        var dashboard = new
        {
            Restaurant = new
            {
                restaurant.Id,
                restaurant.Emertimi,
                restaurant.Statusi,
                restaurant.Rating,
                restaurant.Logo
            },
            PrimaryAddressId = primaryAddressId,
            Addresses = addresses,
            Scope = role == AppRoles.BranchManager ? "branch" : "owner",
            Orders = new
            {
                Total = await scopedOrders.CountAsync(),
                Today = await scopedOrders.CountAsync(o => o.DataPorosis.Date == today),
                ThisWeek = await scopedOrders.CountAsync(o => o.DataPorosis.Date >= startOfWeek),
                ThisMonth = await scopedOrders.CountAsync(o => o.DataPorosis.Date >= startOfMonth),
                Pending = await scopedOrders.CountAsync(o => o.Statusi == OrderStatus.Pending),
                Accepted = await scopedOrders.CountAsync(o => o.Statusi == OrderStatus.Accepted),
                Preparing = await scopedOrders.CountAsync(o => o.Statusi == OrderStatus.Preparing),
                Ready = await scopedOrders.CountAsync(o => o.Statusi == OrderStatus.Ready),
                Delivered = await scopedOrders.CountAsync(o => o.Statusi == OrderStatus.Delivered)
            },
            Revenue = new
            {
                Today = await scopedOrders.Where(o => o.DataPorosis.Date == today).SumAsync(o => o.ShumaTotale),
                ThisWeek = await scopedOrders.Where(o => o.DataPorosis.Date >= startOfWeek).SumAsync(o => o.ShumaTotale),
                ThisMonth = await scopedOrders.Where(o => o.DataPorosis.Date >= startOfMonth).SumAsync(o => o.ShumaTotale),
                Total = await scopedOrders.SumAsync(o => o.ShumaTotale)
            },
            RecentOrders = await scopedOrders
                .OrderByDescending(o => o.DataPorosis)
                .Take(10)
                .Select(o => new
                {
                    o.Id,
                    o.ShumaTotale,
                    o.Statusi,
                    o.DataPorosis,
                    CustomerName = o.User.UserName
                })
                .ToListAsync(),
            Reviews = new
            {
                Average = restaurant.Rating,
                Total = await _context.Reviews.CountAsync(r => r.RestaurantId == restaurant.Id)
            }
        };
        return Ok(dashboard);
    }

    // POST: api/Dashboard/Merchant/upload-logo?restaurantId=123
    [HttpPost("Merchant/upload-logo")]
    [Authorize(Roles = AppRoles.Merchant + "," + AppRoles.BranchManager)]
    public async Task<IActionResult> UploadLogo([FromQuery] int restaurantId, IFormFile logo)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = AppRoles.Normalize(User.FindFirst(ClaimTypes.Role)?.Value);

            Restaurant? restaurant = null;

            if (role == AppRoles.BranchManager)
            {
                // Branch manager: verifiko që i përket një branch-i të këtij restoranti
                var branchAddress = await _context.RestaurantAddresses
                    .FirstOrDefaultAsync(a => a.Id == restaurantId && a.MerchantUserId == userId);

                if (branchAddress == null)
                    return NotFound(new { message = "Restoranti nuk u gjet për këtë branch manager" });

                restaurant = await _context.Restaurants
                    .FirstOrDefaultAsync(r => r.Id == branchAddress.RestaurantId);
            }
            else
            {
                // Merchant i zakonshëm
                restaurant = await _context.Restaurants
                    .FirstOrDefaultAsync(r => r.Id == restaurantId && r.UserId == userId);
            }

            if (restaurant == null)
                return NotFound(new { message = "Restoranti nuk u gjet" });

            if (logo == null || logo.Length == 0)
                return BadRequest(new { message = "Ju lutemi zgjidhni një foto" });

            // Krijo direktorinë
            var webRootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(webRootPath, "uploads", "logos");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // Ruaj foton
            var uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(logo.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await logo.CopyToAsync(stream);
            }

            // Ruaj logon e vjetër për ta fshirë (nëse ka)
            var oldLogoPath = !string.IsNullOrEmpty(restaurant.Logo)
                ? Path.Combine(webRootPath, restaurant.Logo.TrimStart('/'))
                : null;

            // Përditëso logon
            restaurant.Logo = $"/uploads/logos/{uniqueFileName}";
            await _context.SaveChangesAsync();

            // Fshij logon e vjetër
            if (oldLogoPath != null && System.IO.File.Exists(oldLogoPath))
            {
                try
                {
                    System.IO.File.Delete(oldLogoPath);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Could not delete old logo: {ex.Message}");
                }
            }

            return Ok(new
            {
                message = "Logo u ngarkua me sukses!",
                logoUrl = restaurant.Logo
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Gabim gjatë ngarkimit: {ex.Message}" });
        }
    }

    [HttpGet("Driver")]
    [Authorize(Roles = AppRoles.Courier)]
    public async Task<IActionResult> GetDriverDashboard()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var driver = await _context.DeliveryDrivers.FirstOrDefaultAsync(d => d.UserId == userId);

        if (driver == null)
        {
            driver = new DeliveryDrivers
            {
                UserId = userId!,
                Automjeti = "N/A",
                Targa = "N/A",
                Zona = "N/A",
                Statusi = DriverStatus.Available,
                Vlersimi = 0
            };
            _context.DeliveryDrivers.Add(driver);
            await _context.SaveChangesAsync();
        }

        var today = DateTime.Today;
        var startOfWeek = today.AddDays(-(int)today.DayOfWeek);

        var dashboard = new
        {
            Driver = new
            {
                driver.Id,
                driver.Automjeti,
                driver.Statusi,
                driver.Vlersimi
            },
            Deliveries = new
            {
                Total = await _context.Deliveries.CountAsync(d => d.DriverId == driver.Id),
                Today = await _context.Deliveries.CountAsync(d => d.DriverId == driver.Id && d.DataMarrjes != null && d.DataMarrjes.Value.Date == today),
                ThisWeek = await _context.Deliveries.CountAsync(d => d.DriverId == driver.Id && d.DataMarrjes != null && d.DataMarrjes.Value.Date >= startOfWeek),
                Completed = await _context.Deliveries.CountAsync(d => d.DriverId == driver.Id && d.Statusi == DeliveryStatus.Delivered)
            },
            CurrentOrders = await _context.Orders
                .Where(o => _context.Deliveries.Any(d => d.OrderId == o.Id && d.DriverId == driver.Id)
                         && o.Statusi != OrderStatus.Delivered
                         && o.Statusi != OrderStatus.Cancelled)
                .Include(o => o.Restaurant)
                .Select(o => new
                {
                    o.Id,
                    o.AdresaDorezimit,
                    o.ShumaTotale,
                    RestaurantName = o.Restaurant.Emertimi,
                    o.Statusi,
                    o.DataPorosis
                })
                .ToListAsync(),
            DeliveryHistory = await _context.Orders
                .Where(o => _context.Deliveries.Any(d => d.OrderId == o.Id && d.DriverId == driver.Id)
                         && o.Statusi == OrderStatus.Delivered)
                .Include(o => o.Restaurant)
                .Include(o => o.Delivery)
                .OrderByDescending(o => o.DataPorosis)
                .Take(50)
                .Select(o => new
                {
                    o.Id,
                    o.AdresaDorezimit,
                    o.ShumaTotale,
                    RestaurantName = o.Restaurant.Emertimi,
                    o.DataPorosis,
                    DeliveredAt = o.Delivery != null ? o.Delivery.DataDorezimit : (DateTime?)null
                })
                .ToListAsync(),
            AvailableOrders = await _context.Orders
                .Where(o => o.Statusi == OrderStatus.Ready
                         && !_context.Deliveries.Any(d => d.OrderId == o.Id))
                .Include(o => o.Restaurant)
                .Select(o => new
                {
                    o.Id,
                    o.AdresaDorezimit,
                    o.ShumaTotale,
                    RestaurantName = o.Restaurant.Emertimi,
                    o.DataPorosis
                })
                .ToListAsync(),
            Performance = new
            {
                Rating = driver.Vlersimi,
                TotalEarnings = await _context.Deliveries
                    .Where(d => d.DriverId == driver.Id && d.Statusi == DeliveryStatus.Delivered)
                    .SelectMany(d => _context.Orders.Where(o => o.Id == d.OrderId).Select(o => o.ShumaTotale))
                    .SumAsync()
            }
        };
        return Ok(dashboard);
    }

    [HttpPost("Driver/accept/{orderId}")]
    [Authorize(Roles = AppRoles.Courier)]
    public async Task<IActionResult> AcceptOrder(int orderId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var driver = await _context.DeliveryDrivers.FirstOrDefaultAsync(d => d.UserId == userId);
        if (driver == null)
            return NotFound("Driver profile not found.");

        var order = await _context.Orders
            .Include(o => o.Delivery)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
            return NotFound("Order not found.");
        if (order.Statusi != OrderStatus.Ready)
            return BadRequest("Order is not in Ready status.");
        if (order.Delivery != null)
            return BadRequest("Order already has a driver assigned.");

        var delivery = new Deliveries
        {
            OrderId = orderId,
            DriverId = driver.Id,
            Statusi = DeliveryStatus.Pending,
            DataMarrjes = DateTime.Now
        };

        _context.Deliveries.Add(delivery);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Order accepted.", deliveryId = delivery.Id });
    }
}