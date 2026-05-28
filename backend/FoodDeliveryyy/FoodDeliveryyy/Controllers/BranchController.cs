using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FoodDeliveryyy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BranchController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<User> _userManager;

        public BranchController(AppDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpPost("create")]
        [Authorize(Roles = AppRoles.Merchant + "," + AppRoles.Admin)]
        public async Task<IActionResult> CreateBranch([FromBody] CreateBranchDto dto)
        {
            try
            {
                // Validimi bazik
                if (string.IsNullOrWhiteSpace(dto.Address))
                {
                    return BadRequest(new { message = "Address is required" });
                }

                if (string.IsNullOrWhiteSpace(dto.City))
                {
                    return BadRequest(new { message = "City is required" });
                }

                // Merr userId nga token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                // Merr restorantin e merchantit
                var restaurant = await _context.Restaurants
                    .FirstOrDefaultAsync(r => r.UserId == userId);

                if (restaurant == null)
                {
                    return BadRequest(new { message = "No restaurant found for this merchant" });
                }

                var branch = new RestaurantAddress
                {
                    Adresa = dto.Address,
                    Qyteti = dto.City,
                    Zona = dto.Zone ?? "",
                    IsMain = dto.IsMain,
                    IsActive = dto.IsActive,
                    Latitude = dto.Latitude,
                    Longitude = dto.Longitude,
                    TarifaDorezimit = dto.DeliveryFee,
                    RestaurantId = restaurant.Id,
                    MerchantUserId = null
                };

                _context.RestaurantAddresses.Add(branch);
                await _context.SaveChangesAsync();

                int? branchManagerId = null;

                // Krijoni Branch Manager nëse kërkohet
                if (dto.CreateBranchManager && !string.IsNullOrEmpty(dto.ManagerEmail))
                {
                    var username = GenerateUsername(dto.ManagerName ?? dto.ManagerEmail.Split('@')[0]);
                    var password = GenerateRandomPassword();

                    var branchManager = new User
                    {
                        UserName = username,
                        Email = dto.ManagerEmail,
                        EmailConfirmed = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    var createResult = await _userManager.CreateAsync(branchManager, password);

                    if (createResult.Succeeded)
                    {
                        await _userManager.AddToRoleAsync(branchManager, "BranchManager");

                        // Lidh branch manager-in me branch-in
                        branch.MerchantUserId = branchManager.Id;
                        await _context.SaveChangesAsync();

                        branchManagerId = branch.Id;

                        // Shfaq kredencialet në terminal
                        Console.WriteLine("");
                        Console.WriteLine("╔════════════════════════════════════════════════════════════════════════════════╗");
                        Console.WriteLine("║                      ✅ NEW BRANCH MANAGER ACCOUNT CREATED ✅                  ║");
                        Console.WriteLine("╠════════════════════════════════════════════════════════════════════════════════╣");
                        Console.WriteLine($"║  📧 Email:      {dto.ManagerEmail,-55}║");
                        Console.WriteLine($"║  👤 Username:   {username,-55}║");
                        Console.WriteLine($"║  🔑 Password:   {password,-55}║");
                        Console.WriteLine($"║  🏪 Branch:     {dto.Address,-55}║");
                        Console.WriteLine("╠════════════════════════════════════════════════════════════════════════════════╣");
                        Console.WriteLine("║  🌐 Login URL:  http://localhost:5173                                          ║");
                        Console.WriteLine("╚════════════════════════════════════════════════════════════════════════════════╝");
                        Console.WriteLine("");
                    }
                    else
                    {
                        Console.WriteLine($"Failed to create branch manager: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                    }
                }

                return Ok(new
                {
                    message = "Branch created successfully",
                    branchId = branch.Id,
                    branchManagerCreated = dto.CreateBranchManager && branchManagerId != null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error creating branch: {ex.Message}" });
            }
        }

        private string GenerateUsername(string name)
        {
            var baseName = name.ToLower()
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
            return $"Branch@{numbers}";
        }
    }

    public class CreateBranchDto
    {
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Zone { get; set; } = string.Empty;
        public decimal DeliveryFee { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool IsMain { get; set; }
        public bool IsActive { get; set; }
        public bool CreateBranchManager { get; set; }
        public string? ManagerName { get; set; }
        public string? ManagerEmail { get; set; }
    }
}