

using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

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


    [HttpGet("{id:int}")]
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
    public async Task<ActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                imageUrl = c.ImageUrl
            })
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

    [HttpGet("nearby")]
    public async Task<ActionResult> GetNearbyRestaurants([FromQuery] double latitude, [FromQuery] double longitude, [FromQuery] int take = 20)
    {
        if (latitude is < -90 or > 90 || longitude is < -180 or > 180)
        {
            return BadRequest("Invalid coordinates.");
        }

        if (take <= 0) take = 20;
        if (take > 100) take = 100;

        var restaurants = await _context.Restaurants
            .Include(r => r.Adresat)
            .ToListAsync();

        var nearby = restaurants
            .Select(r =>
            {
                var activeAddresses = r.Adresat
                    .Where(a => a.IsActive && a.Latitude.HasValue && a.Longitude.HasValue)
                    .ToList();

                if (!activeAddresses.Any()) return null;

                var closestAddress = activeAddresses
                    .OrderBy(a => DistanceKm(latitude, longitude, a.Latitude!.Value, a.Longitude!.Value))
                    .First();

                var distanceKm = DistanceKm(latitude, longitude, closestAddress.Latitude!.Value, closestAddress.Longitude!.Value);

                return new
                {
                    id = r.Id,
                    name = r.Emertimi,
                    image = r.Logo,
                    category = r.Kategori,
                    distanceKm = Math.Round(distanceKm, 2),
                    nearestAddress = closestAddress.Adresa,
                    city = closestAddress.Qyteti,
                    latitude = closestAddress.Latitude,
                    longitude = closestAddress.Longitude
                };
            })
            .Where(x => x != null)
            .OrderBy(x => x!.distanceKm)
            .Take(take)
            .ToList();

        return Ok(nearby);
    }

    private static double DistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusKm = 6371.0;
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Pow(Math.Sin(dLat / 2), 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Pow(Math.Sin(dLon / 2), 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;


}

