

using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodDeliveryyy.Controllers;

[Route("api/[controller]")]
[ApiController]

    public class RestaurantsController : ControllerBase
    {
    private readonly AppDbContext _context;
    public RestaurantsController(AppDbContext context)
    {
        _context = context;
    }
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Restaurant>>> GetRestaurant([FromQuery] string? search)
    {
        var query = _context.Restaurants.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            search = search.Trim().ToLower();

            query = query.Where(r =>
                r.Emertimi.ToLower().Contains(search) ||
                (r.Kategori != null && r.Kategori.ToLower().Contains(search))
            );
        }

        return await query.ToListAsync();
    }


    [HttpGet("{id}")]
    public async Task<ActionResult<Restaurant>> GetRestaurant(int id)
    {
        var restaurant = await _context.Restaurants.FindAsync(id);
        if (restaurant == null) return NotFound();
        return restaurant;
    }

    [HttpPost]
    public async Task<ActionResult<Restaurant>> CreateRestaurant(Restaurant restaurant)
    {
        _context.Restaurants.Add(restaurant);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetRestaurant), new { id = restaurant.Id }, restaurant);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateRestaurant(int id, Restaurant restaurant)
    {
        if (id != restaurant.Id) return BadRequest();
        _context.Entry(restaurant).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteRestaurant(int id)
    {
        var restaurant = await _context.Restaurants.FindAsync(id);
        if (restaurant == null) return NotFound();
        _context.Restaurants.Remove(restaurant);
        await _context.SaveChangesAsync();
        return NoContent();
    }
    [HttpGet("kategori")]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var categories = await _context.Restaurants
            .Select(r => r.Kategori)   
            .Distinct()
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("bykategori/{kategori}")]
    public async Task<ActionResult<IEnumerable<Restaurant>>> GetRestaurantsByCategory(string kategori)
    {
        var restaurants = await _context.Restaurants
            .Where(r => r.Kategori == kategori)
            .ToListAsync();

        return Ok(restaurants);
    }


}

