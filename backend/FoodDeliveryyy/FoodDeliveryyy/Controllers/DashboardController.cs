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
    public DashboardController(AppDbContext context)
    {
        _context = context;
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
    [Authorize(Roles = AppRoles.Merchant)]
    public async Task<IActionResult> GetMerchantDashboard()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.UserId == userId);

        if (restaurant == null)
            return NotFound("No restaurant found for this merchant");

        var today = DateTime.Today;
        var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
        var startOfMonth = new DateTime(today.Year, today.Month, 1);

        var dashboard =
            new
            {
                Restaurant = new
                {
                    restaurant.Id,
                    restaurant.Emertimi,
                    restaurant.Statusi,
                    restaurant.Rating

                },

                Orders = new
                {
                    Total = await _context.Orders.CountAsync(o => o.RestaurantId == restaurant.Id),
                    Today = await _context.Orders.CountAsync(o => o.RestaurantId == restaurant.Id && o.DataPorosis.Date == today),
                    ThisWeek = await _context.Orders.CountAsync(o => o.RestaurantId == restaurant.Id && o.DataPorosis.Date >= startOfWeek),
                    ThisMonth = await _context.Orders.CountAsync(o => o.RestaurantId == restaurant.Id && o.DataPorosis.Date >= startOfMonth),
                    Pending = await _context.Orders.CountAsync(o => o.RestaurantId == restaurant.Id && o.Statusi == OrderStatus.Pending),
                    Preparing = await _context.Orders.CountAsync(o => o.RestaurantId == restaurant.Id && o.Statusi == OrderStatus.Preparing),
                    Ready = await _context.Orders.CountAsync(o => o.RestaurantId == restaurant.Id && o.Statusi == OrderStatus.Ready),
                    Delivered = await _context.Orders.CountAsync(o => o.RestaurantId == restaurant.Id && o.Statusi == OrderStatus.Delivered)
                },

                Revenue = new
                {
                    Today = await _context.Orders.Where(o => o.RestaurantId == restaurant.Id && o.DataPorosis.Date == today).SumAsync(o => o.ShumaTotale),
                    ThisWeek = await _context.Orders.Where(o => o.RestaurantId == restaurant.Id && o.DataPorosis.Date >= startOfWeek).SumAsync(o => o.ShumaTotale),
                    ThisMonth = await _context.Orders.Where(o => o.RestaurantId == restaurant.Id && o.DataPorosis.Date >= startOfMonth).SumAsync(o => o.ShumaTotale),
                    Total = await _context.Orders.Where(o => o.RestaurantId == restaurant.Id).SumAsync(o => o.ShumaTotale)
                },

                RecentOrders = await _context.Orders
                .Where(o => o.RestaurantId == restaurant.Id)
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

    [HttpGet("Driver")]
    [Authorize(Roles = AppRoles.Courier)]
    public async Task<IActionResult> GetDriverDashboard()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var driver = await _context.DeliveryDrivers.FirstOrDefaultAsync(d => d.UserId == userId);

        if (driver == null)
            return NotFound("Driver profile not found");

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
                Today = await _context.Deliveries.CountAsync(d => d.DriverId == driver.Id && d.DataMarrjes !=null && d.DataMarrjes.Value.Date== today),
                ThisWeek = await _context.Deliveries.CountAsync(d => d.DriverId == driver.Id && d.DataMarrjes !=null && d.DataMarrjes.Value.Date >= startOfWeek),
                Completed = await _context.Deliveries.CountAsync(d => d.DriverId == driver.Id && d.Statusi == DeliveryStatus.Delivered)
            },

            CurrentOrders = await _context.Orders
                .Where(o => o.Delivery != null && o.Delivery.DriverId == driver.Id && o.Statusi != OrderStatus.Delivered)
                .Include(o => o.Restaurant)
                .Select(o => new
                {
                    o.Id,
                    o.AdresaDorezimit,
                    o.ShumaTotale,
                    RestaurantName = o.Restaurant.Emertimi,
                    o.Statusi
                })
                .ToListAsync(),

            Performance = new
            {
                Rating = driver.Vlersimi,
                TotalEarnings = await _context.Deliveries
                    .Where(d => d.DriverId == driver.Id && d.Statusi == DeliveryStatus.Delivered)
                    .SumAsync(d => d.Order.TarifaDorezimit)
            }
        };
        return Ok(dashboard);
    }
}
