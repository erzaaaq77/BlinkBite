

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
    public async Task<ActionResult<IEnumerable<Restaurant>>> GetRestaurant()   {
        return await _context.Restaurants.ToListAsync();
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
}

