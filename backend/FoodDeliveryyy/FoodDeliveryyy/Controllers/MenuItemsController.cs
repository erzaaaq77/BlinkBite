using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FoodDeliveryyy.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = AppRoles.Merchant + "," + AppRoles.BranchManager + "," + AppRoles.Admin)]
public class MenuItemsController : ControllerBase
{
    private readonly AppDbContext _context;

    public MenuItemsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> GetMenuItems([FromQuery] int? branchId = null)
    {
        try
        {
            var items = await _context.MenuItems
                .Include(m => m.BranchDetails)
                .ToListAsync();

            // Project to a simple DTO to avoid serialization of EF tracking/proxy types
            var result = items.Select(item => {
                var branch = branchId.HasValue ? item.BranchDetails?.FirstOrDefault(b => b.RestaurantAddressId == branchId.Value) : null;
                return new {
                    item.Id,
                    item.Emertimi,
                    item.Pershkrimi,
                    Cmimi = branch?.Cmimi ?? item.Cmimi,
                    item.Foto,
                    Disponueshme = branch?.Disponueshme ?? item.Disponueshme,
                    Alergjene = item.Alergjene,
                    Kalori = item.Kalori,
                    Perberesit = branch?.Perberesit ?? item.Perberesit,
                    RequestOptions = branch?.RequestOptions ?? item.RequestOptions,
                    item.CategoryId,
                    item.RestaurantAddressId,
                    BranchCustom = branch == null ? null : new {
                        branch.Id,
                        branch.MenuItemId,
                        branch.RestaurantAddressId,
                        branch.Cmimi,
                        branch.Disponueshme,
                        branch.Perberesit,
                        branch.RequestOptions,
                        branch.PromotionId
                    }
                };
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            // Return a generic error payload; in development you may include ex.Message
            return StatusCode(500, new { message = "An error occurred while fetching menu items.", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<MenuItems>> GetMenuItem(int id)
    {
        var menuItem = await _context.MenuItems.FindAsync(id);
        if (menuItem == null)
        {
            return NotFound();
        }
        return menuItem;
    }

    [HttpPost]
    [Authorize (Roles = AppRoles.Merchant + "," + AppRoles.BranchManager + "," + AppRoles.Admin)]
    public async Task<ActionResult<MenuItems>> CreateMenuItem(MenuItems menuItem)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = AppRoles.Normalize(User.FindFirst(ClaimTypes.Role)?.Value);

        var category = await _context.MenuCategories.FirstOrDefaultAsync(c => c.Id == menuItem.CategoryId);
        if (category == null)
        {
            return BadRequest("Invalid categoryId.");
        }

        var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.Id == category.RestaurantId);
        if (restaurant == null)
        {
            return BadRequest("Restaurant not found for this category.");
        }

        if (role == AppRoles.Merchant && restaurant.UserId != userId)
        {
            return Forbid();
        }

        if (role == AppRoles.BranchManager && !menuItem.RestaurantAddressId.HasValue)
        {
            return BadRequest("Branch managers must provide restaurantAddressId.");
        }

        if (menuItem.RestaurantAddressId.HasValue)
        {
            var address = await _context.RestaurantAddresses.FirstOrDefaultAsync(a => a.Id == menuItem.RestaurantAddressId.Value);
            if (address == null || address.RestaurantId != category.RestaurantId)
            {
                return BadRequest("Invalid restaurantAddressId.");
            }

            if (role == AppRoles.BranchManager && address.MerchantUserId != userId)
            {
                return Forbid();
            }
        }

        // Accept client payloads with nested category object, but persist by FK only.
        menuItem.Category = null;
        menuItem.RestaurantAddress = null;
        _context.MenuItems.Add(menuItem);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMenuItem), new { id = menuItem.Id }, menuItem);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = AppRoles.Merchant + "," + AppRoles.BranchManager + "," + AppRoles.Admin)]

    public async Task<IActionResult> UpdateMenuItem(int id, MenuItems menuItem)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = AppRoles.Normalize(User.FindFirst(ClaimTypes.Role)?.Value);

        if (id != menuItem.Id)
        {
            return BadRequest();
        }

        var category = await _context.MenuCategories.FirstOrDefaultAsync(c => c.Id == menuItem.CategoryId);
        if (category == null)
        {
            return BadRequest("Invalid categoryId.");
        }

        var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.Id == category.RestaurantId);
        if (restaurant == null)
        {
            return BadRequest("Restaurant not found for this category.");
        }

        if (role == AppRoles.Merchant && restaurant.UserId != userId)
        {
            return Forbid();
        }

        if (role == AppRoles.BranchManager && !menuItem.RestaurantAddressId.HasValue)
        {
            return BadRequest("Branch managers must provide restaurantAddressId.");
        }

        if (menuItem.RestaurantAddressId.HasValue)
        {
            var address = await _context.RestaurantAddresses.FirstOrDefaultAsync(a => a.Id == menuItem.RestaurantAddressId.Value);
            if (address == null || address.RestaurantId != category.RestaurantId)
            {
                return BadRequest("Invalid restaurantAddressId.");
            }

            if (role == AppRoles.BranchManager && address.MerchantUserId != userId)
            {
                return Forbid();
            }
        }

        var existing = await _context.MenuItems.FindAsync(id);
        if (existing == null)
        {
            return NotFound();
        }

        // Only update scalar fields on MenuItem; category relationship is by FK.
        existing.Emertimi = menuItem.Emertimi;
        existing.Pershkrimi = menuItem.Pershkrimi;
        existing.Cmimi = menuItem.Cmimi;
        existing.Foto = menuItem.Foto;
        existing.Disponueshme = menuItem.Disponueshme;
        existing.Alergjene = menuItem.Alergjene;
        existing.Kalori = menuItem.Kalori;
        existing.Perberesit = menuItem.Perberesit;
        existing.RequestOptions = menuItem.RequestOptions;
        existing.CategoryId = menuItem.CategoryId;
        existing.RestaurantAddressId = menuItem.RestaurantAddressId;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!MenuItemExists(id))
            {
                return NotFound();
            }
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = AppRoles.Merchant + "," + AppRoles.BranchManager + "," + AppRoles.Admin)]

    public async Task<IActionResult> DeleteMenuItem(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = AppRoles.Normalize(User.FindFirst(ClaimTypes.Role)?.Value);

        var menuItem = await _context.MenuItems.FindAsync(id);
        if (menuItem == null)
        {
            return NotFound();
        }

        if (role == AppRoles.Merchant)
        {
            var category = await _context.MenuCategories.FirstOrDefaultAsync(c => c.Id == menuItem.CategoryId);
            if (category == null)
            {
                return BadRequest("Invalid categoryId.");
            }

            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.Id == category.RestaurantId);
            if (restaurant == null || restaurant.UserId != userId)
            {
                return Forbid();
            }
        }

        if (role == AppRoles.BranchManager)
        {
            if (!menuItem.RestaurantAddressId.HasValue)
            {
                return Forbid();
            }

            var address = await _context.RestaurantAddresses.FirstOrDefaultAsync(a => a.Id == menuItem.RestaurantAddressId.Value);
            if (address == null || address.MerchantUserId != userId)
            {
                return Forbid();
            }
        }

        _context.MenuItems.Remove(menuItem);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool MenuItemExists(int id)
    {
        return _context.MenuItems.Any(e => e.Id == id);
    }
}


