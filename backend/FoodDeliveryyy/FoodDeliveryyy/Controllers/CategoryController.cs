using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodDeliveryyy.Controllers;

[Route("api/[controller]")]

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
public class CategoryController : ControllerBase

{
    private readonly AppDbContext _context;

    public CategoryController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllCategories()
    {
        var categories = await _context.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCategoriesById(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return NotFound();
        return Ok(category);

    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] Category category)
    {
        if (string.IsNullOrWhiteSpace(category.Name))
            return BadRequest("Category name is required.");

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        return Ok(category);
    }

    [HttpPost("{id}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] Category updatedCategory)
    {
        if (id != updatedCategory.Id)
            return BadRequest("ID mismatch.");

        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return NotFound();

        category.Name = updatedCategory.Name;
        category.ImageUrl = updatedCategory.ImageUrl;

        await _context.SaveChangesAsync();
        return Ok(category);
    }

    [HttpDelete("{id}")]

    public async Task<IActionResult>DeleteCategory(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return NotFound();

        var hasRestaurants = await _context.Restaurants.AnyAsync(r => r.CategoryId == id);
        if (hasRestaurants)
            return BadRequest("Cannot delete category with restaurants. Move restaurants first.");
        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return Ok(new { message="Category deleted successfully." });
    }

}
