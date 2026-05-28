using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Enums;
using FoodDeliveryyy.Models.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodDeliveryyy.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/applications")]
public class AdminApplicationController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;

    public AdminApplicationController(
        AppDbContext context,
        UserManager<User> userManager,
        RoleManager<Role> roleManager)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    [HttpGet]
    public IActionResult Test()
    {
        return Ok(new { message = "Admin controller is working!" });
    }

    [HttpGet("restaurants")]
    public async Task<IActionResult> GetRestaurantApplications([FromQuery] string? status = null)
    {
        var query = _context.RestaurantApplications.AsQueryable();
        if (!string.IsNullOrEmpty(status))
            query = query.Where(x => x.Status == status);

        var applications = await query.OrderByDescending(x => x.AppliedAt).ToListAsync();
        return Ok(applications);
    }

    [HttpGet("couriers")]
    public async Task<IActionResult> GetCourierApplications([FromQuery] string? status = null)
    {
        var query = _context.CourierApplications.AsQueryable();
        if (!string.IsNullOrEmpty(status))
            query = query.Where(x => x.Status == status);

        var applications = await query.OrderByDescending(x => x.AppliedAt).ToListAsync();
        return Ok(applications);
    }

    [HttpPost("restaurant/{id}/approve")]
    public async Task<IActionResult> ApproveRestaurant(int id, [FromBody] ApproveDto? dto)
    {
        var application = await _context.RestaurantApplications.FindAsync(id);
        if (application == null)
            return NotFound(new { message = "Application not found" });

        if (application.Status != "Pending")
            return BadRequest(new { message = "This application has already been reviewed" });

        var username = GenerateUsername(application.RestaurantName);
        var user = new User
        {
            UserName = username,
            Email = application.Email,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var password = GenerateRandomPassword();
        var createResult = await _userManager.CreateAsync(user, password);

        if (!createResult.Succeeded)
        {
            return BadRequest(new { message = "Cannot create account", errors = createResult.Errors });
        }

        await _userManager.AddToRoleAsync(user, "Merchant");

        var restaurant = new Restaurant
        {
            Emertimi = application.RestaurantName,
            Pershkrimi = application.RestaurantDescription ?? "",
            Telefoni = application.Phone,
            Email = application.Email,
            UserId = user.Id,
            Statusi = RestaurantStatus.Active,
            Rating = 0,
            Kategori = application.Category ?? "Fast Food"
        };

        _context.Restaurants.Add(restaurant);
        await _context.SaveChangesAsync();

        var address = new RestaurantAddress
        {
            RestaurantId = restaurant.Id,
            Adresa = application.Address,
            Qyteti = application.City,
            IsMain = true,
            IsActive = true
        };

        _context.RestaurantAddresses.Add(address);
        await _context.SaveChangesAsync();

        application.Status = "Approved";
        application.ReviewedAt = DateTime.UtcNow;
        application.AdminNotes = dto?.Notes;
        await _context.SaveChangesAsync();

        Console.WriteLine("");
        Console.WriteLine("╔════════════════════════════════════════════════════════════════════════════════╗");
        Console.WriteLine("║                         ✅ NEW MERCHANT ACCOUNT CREATED ✅                      ║");
        Console.WriteLine("╠════════════════════════════════════════════════════════════════════════════════╣");
        Console.WriteLine($"║  📧 Email:      {application.Email,-55}║");
        Console.WriteLine($"║  👤 Username:   {username,-55}║");
        Console.WriteLine($"║  🔑 Password:   {password,-55}║");
        Console.WriteLine($"║  🏪 Restaurant: {application.RestaurantName,-55}║");
        Console.WriteLine($"║  📍 City:       {application.City,-55}║");
        Console.WriteLine($"║  🏷️  Category:   {application.Category ?? "N/A",-55}║");
        Console.WriteLine("╠════════════════════════════════════════════════════════════════════════════════╣");
        Console.WriteLine("║  🌐 Login URL:  http://localhost:5173                                          ║");
        Console.WriteLine("╚════════════════════════════════════════════════════════════════════════════════╝");
        Console.WriteLine("");

        return Ok(new
        {
            message = "Restaurant approved and account created",
            email = application.Email,
            username = username,
            password = password,
            restaurantId = restaurant.Id
        });
    }

    [HttpPost("courier/{id}/approve")]
    public async Task<IActionResult> ApproveCourier(int id, [FromBody] ApproveDto? dto)
    {
        var application = await _context.CourierApplications.FindAsync(id);
        if (application == null)
            return NotFound(new { message = "Application not found" });

        if (application.Status != "Pending")
            return BadRequest(new { message = "This application has already been reviewed" });

        var username = GenerateUsernameFromName(application.FullName);
        var user = new User
        {
            UserName = username,
            Email = application.Email,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var password = GenerateRandomPassword();
        var createResult = await _userManager.CreateAsync(user, password);

        if (!createResult.Succeeded)
        {
            return BadRequest(new { message = "Cannot create account", errors = createResult.Errors });
        }

        await _userManager.AddToRoleAsync(user, "Courier");

        var driver = new DeliveryDrivers
        {
            UserId = user.Id,
            Automjeti = application.VehicleType,
            Targa = application.LicensePlate ?? "",
            Zona = application.WorkingArea,
            Statusi = DriverStatus.Available,
            Vlersimi = 0
        };

        _context.DeliveryDrivers.Add(driver);
        await _context.SaveChangesAsync();

        application.Status = "Approved";
        application.ReviewedAt = DateTime.UtcNow;
        application.AdminNotes = dto?.Notes;
        await _context.SaveChangesAsync();

        Console.WriteLine("");
        Console.WriteLine("╔════════════════════════════════════════════════════════════════════════════════╗");
        Console.WriteLine("║                          ✅ NEW COURIER ACCOUNT CREATED ✅                      ║");
        Console.WriteLine("╠════════════════════════════════════════════════════════════════════════════════╣");
        Console.WriteLine($"║  📧 Email:      {application.Email,-55}║");
        Console.WriteLine($"║  👤 Username:   {username,-55}║");
        Console.WriteLine($"║  🔑 Password:   {password,-55}║");
        Console.WriteLine($"║  👤 Full Name:  {application.FullName,-55}║");
        Console.WriteLine($"║  🚗 Vehicle:    {application.VehicleType,-55}║");
        Console.WriteLine($"║  📍 Area:       {application.WorkingArea,-55}║");
        Console.WriteLine("╠════════════════════════════════════════════════════════════════════════════════╣");
        Console.WriteLine("║  🌐 Login URL:  http://localhost:5173                                          ║");
        Console.WriteLine("╚════════════════════════════════════════════════════════════════════════════════╝");
        Console.WriteLine("");

        return Ok(new
        {
            message = "Courier approved and account created",
            email = application.Email,
            username = username,
            password = password
        });
    }

    [HttpPost("restaurant/{id}/reject")]
    public async Task<IActionResult> RejectRestaurant(int id, [FromBody] RejectDto dto)
    {
        var application = await _context.RestaurantApplications.FindAsync(id);
        if (application == null)
            return NotFound(new { message = "Application not found" });

        application.Status = "Rejected";
        application.ReviewedAt = DateTime.UtcNow;
        application.AdminNotes = dto.Reason;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Application rejected" });
    }

    [HttpPost("courier/{id}/reject")]
    public async Task<IActionResult> RejectCourier(int id, [FromBody] RejectDto dto)
    {
        var application = await _context.CourierApplications.FindAsync(id);
        if (application == null)
            return NotFound(new { message = "Application not found" });

        application.Status = "Rejected";
        application.ReviewedAt = DateTime.UtcNow;
        application.AdminNotes = dto.Reason;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Application rejected" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRestaurant(int id)
    {
        var application = await _context.RestaurantApplications.FindAsync(id);
        if (application == null)
            return NotFound(new { message = "Application not found" });

        var restaurant = await _context.Restaurants
            .FirstOrDefaultAsync(r => r.Email == application.Email || r.Emertimi == application.RestaurantName);

        if (restaurant == null)
            return NotFound(new { message = "Restaurant not found" });

        // Fshij të gjitha orders të lidhura
        var orders = _context.Orders.Where(o => o.RestaurantId == restaurant.Id).ToList();
        _context.Orders.RemoveRange(orders);

        // Fshij të gjitha reviews të lidhura
        var reviews = _context.Reviews.Where(r => r.RestaurantId == restaurant.Id).ToList();
        _context.Reviews.RemoveRange(reviews);

        // Fshij të gjitha deliveries të lidhura me këto orders
        var orderIds = orders.Select(o => o.Id).ToList();
        var deliveries = _context.Deliveries.Where(d => orderIds.Contains(d.OrderId)).ToList();
        _context.Deliveries.RemoveRange(deliveries);

        // Fshij adresat
        var addresses = _context.RestaurantAddresses.Where(a => a.RestaurantId == restaurant.Id).ToList();
        _context.RestaurantAddresses.RemoveRange(addresses);

        // Fshij menu kategoritë dhe itemet
        var menuCategories = _context.MenuCategories.Where(c => c.RestaurantId == restaurant.Id).ToList();
        foreach (var category in menuCategories)
        {
            var menuItems = _context.MenuItems.Where(m => m.CategoryId == category.Id).ToList();
            _context.MenuItems.RemoveRange(menuItems);
        }
        _context.MenuCategories.RemoveRange(menuCategories);

        // Fshij restorantin dhe aplikacionin
        _context.Restaurants.Remove(restaurant);
        _context.RestaurantApplications.Remove(application);

        await _context.SaveChangesAsync();

        return Ok(new { message = "Restaurant deleted successfully" });
    }
    private string GenerateUsername(string restaurantName)
    {
        var baseName = restaurantName.ToLower()
            .Replace(" ", "")
            .Replace("-", "")
            .Replace("&", "")
            .Replace(".", "");

        if (baseName.Length > 20)
            baseName = baseName.Substring(0, 20);

        var username = baseName;
        var counter = 1;

        while (_userManager.Users.Any(u => u.UserName == username))
        {
            username = $"{baseName}{counter}";
            counter++;
        }

        return username;
    }

    private string GenerateUsernameFromName(string fullName)
    {
        var baseName = fullName.ToLower()
            .Replace(" ", ".")
            .Replace("-", "")
            .Replace(".", "");

        if (baseName.Length > 20)
            baseName = baseName.Substring(0, 20);

        var username = baseName;
        var counter = 1;

        while (_userManager.Users.Any(u => u.UserName == username))
        {
            username = $"{baseName}{counter}";
            counter++;
        }

        return username;
    }

    private string GenerateRandomPassword()
    {
        var random = new Random();
        var numbers = random.Next(1000, 9999);
        return $"BlinkBite@{numbers}";
    }
}

public class ApproveDto
{
    public string? Notes { get; set; }
}

public class RejectDto
{
    public string Reason { get; set; } = string.Empty;
}