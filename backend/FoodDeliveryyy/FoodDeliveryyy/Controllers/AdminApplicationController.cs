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

    // GET: api/admin/applications/restaurants
    [HttpGet("restaurants")]
    public async Task<IActionResult> GetRestaurantApplications([FromQuery] string? status = null)
    {
        var query = _context.RestaurantApplications.AsQueryable();
        if (!string.IsNullOrEmpty(status))
            query = query.Where(x => x.Status == status);

        var applications = await query.OrderByDescending(x => x.AppliedAt).ToListAsync();
        return Ok(applications);
    }

    // GET: api/admin/applications/couriers
    [HttpGet("couriers")]
    public async Task<IActionResult> GetCourierApplications([FromQuery] string? status = null)
    {
        var query = _context.CourierApplications.AsQueryable();
        if (!string.IsNullOrEmpty(status))
            query = query.Where(x => x.Status == status);

        var applications = await query.OrderByDescending(x => x.AppliedAt).ToListAsync();
        return Ok(applications);
    }

    // POST: api/admin/applications/restaurant/{id}/approve
    [HttpPost("restaurant/{id}/approve")]
    public async Task<IActionResult> ApproveRestaurant(int id, [FromBody] ApproveDto? dto)
    {
        var application = await _context.RestaurantApplications.FindAsync(id);
        if (application == null)
            return NotFound(new { message = "Aplikimi nuk u gjet" });

        if (application.Status != "Pending")
            return BadRequest(new { message = "Ky aplikim tashmë është shqyrtuar" });

        // Krijo user-in
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
            return BadRequest(new { message = "Nuk mund të krijohet llogaria", errors = createResult.Errors });
        }

        // Cakto rolin Merchant
        await _userManager.AddToRoleAsync(user, "Merchant");

        // Krijo restorantin
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

        // Krijo adresën e restorantit
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

        // Përditëso aplikimin
        application.Status = "Approved";
        application.ReviewedAt = DateTime.UtcNow;
        application.AdminNotes = dto?.Notes;
        await _context.SaveChangesAsync();

        // Dërgo email (për momentin vetëm console log)
        Console.WriteLine($"=== LLOGARIA U KRIJUA ===");
        Console.WriteLine($"Email: {application.Email}");
        Console.WriteLine($"Username: {username}");
        Console.WriteLine($"Password: {password}");
        Console.WriteLine($"=========================");

        return Ok(new
        {
            message = "Restoranti u miratua dhe llogaria u krijua",
            email = application.Email,
            username = username,
            password = password
        });
    }

    // POST: api/admin/applications/courier/{id}/approve
    [HttpPost("courier/{id}/approve")]
    public async Task<IActionResult> ApproveCourier(int id, [FromBody] ApproveDto? dto)
    {
        var application = await _context.CourierApplications.FindAsync(id);
        if (application == null)
            return NotFound(new { message = "Aplikimi nuk u gjet" });

        if (application.Status != "Pending")
            return BadRequest(new { message = "Ky aplikim tashmë është shqyrtuar" });

        // Krijo user-in
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
            return BadRequest(new { message = "Nuk mund të krijohet llogaria", errors = createResult.Errors });
        }

        // Cakto rolin Courier
        await _userManager.AddToRoleAsync(user, "Courier");

        // Krijo delivery driver-in
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

        // Përditëso aplikimin
        application.Status = "Approved";
        application.ReviewedAt = DateTime.UtcNow;
        application.AdminNotes = dto?.Notes;
        await _context.SaveChangesAsync();

        // Dërgo email (për momentin vetëm console log)
        Console.WriteLine($"=== LLOGARIA U KRIJUA ===");
        Console.WriteLine($"Email: {application.Email}");
        Console.WriteLine($"Username: {username}");
        Console.WriteLine($"Password: {password}");
        Console.WriteLine($"=========================");

        return Ok(new
        {
            message = "Courier u miratua dhe llogaria u krijua",
            email = application.Email,
            username = username,
            password = password
        });
    }

    // POST: api/admin/applications/restaurant/{id}/reject
    [HttpPost("restaurant/{id}/reject")]
    public async Task<IActionResult> RejectRestaurant(int id, [FromBody] RejectDto dto)
    {
        var application = await _context.RestaurantApplications.FindAsync(id);
        if (application == null)
            return NotFound(new { message = "Aplikimi nuk u gjet" });

        application.Status = "Rejected";
        application.ReviewedAt = DateTime.UtcNow;
        application.AdminNotes = dto.Reason;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Aplikimi u refuzua" });
    }

    // POST: api/admin/applications/courier/{id}/reject
    [HttpPost("courier/{id}/reject")]
    public async Task<IActionResult> RejectCourier(int id, [FromBody] RejectDto dto)
    {
        var application = await _context.CourierApplications.FindAsync(id);
        if (application == null)
            return NotFound(new { message = "Aplikimi nuk u gjet" });

        application.Status = "Rejected";
        application.ReviewedAt = DateTime.UtcNow;
        application.AdminNotes = dto.Reason;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Aplikimi u refuzua" });
    }

    private string GenerateUsername(string restaurantName)
    {
        var baseName = restaurantName.ToLower()
            .Replace(" ", "")
            .Replace("-", "")
            .Replace("&", "")
            .Replace(".", "");

        // Kufizo gjatësinë
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

        // Kufizo gjatësinë
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