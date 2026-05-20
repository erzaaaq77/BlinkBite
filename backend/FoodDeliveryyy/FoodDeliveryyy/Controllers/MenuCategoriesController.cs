using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Identity;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


[Route("api/[controller]")]
[ApiController]
public class MenuCategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public MenuCategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MenuCategory>>> GetMenuCategories()
    {
        return await _context.MenuCategories.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MenuCategory>> GetMenuCategory(int id)
    {
        var category = await _context.MenuCategories.FindAsync(id);
        if (category == null) return NotFound();
        return category;
    }

    [HttpGet("by-restaurant/{restaurantId}")]
    public async Task<ActionResult<IEnumerable<MenuCategory>>> GetByRestaurant(int restaurantId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (AppRoles.Normalize(role) == AppRoles.Merchant)
        {
            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.Id == restaurantId && r.UserId == userId);
            if (restaurant == null)
            {
                return Forbid();
            }
        }

        var categories = await _context.MenuCategories
            .Where(c => c.RestaurantId == restaurantId)
            .OrderBy(c => c.Renditja)
            .ToListAsync();
        return Ok(categories);
    }

    [HttpPost]
    public async Task<ActionResult<MenuCategory>> CreateMenuCategory(MenuCategory category)
    {
        _context.MenuCategories.Add(category);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMenuCategory), new { id = category.Id }, category);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMenuCategory(int id, MenuCategory category)
    {
        if (id != category.Id) return BadRequest();
        _context.Entry(category).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMenuCategory(int id)
    {
        var category = await _context.MenuCategories.FindAsync(id);
        if (category == null) return NotFound();
        _context.MenuCategories.Remove(category);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}