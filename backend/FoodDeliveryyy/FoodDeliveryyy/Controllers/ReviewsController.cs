using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodDeliveryyy.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Reviews>>> GetReviews()
    {
        return await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Restaurant)
            .Include(r => r.Order)
            .OrderByDescending(r => r.DataKrijimit)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Reviews>> GetReview(int id)
    {
        var review = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Restaurant)
            .Include(r => r.Order)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (review == null)
        {
            return NotFound();
        }

        return review;
    }

    [HttpGet("by-restaurant/{restaurantId}")]
    public async Task<ActionResult<IEnumerable<Reviews>>> GetReviewsByRestaurant(int restaurantId)
    {
        var reviews = await _context.Reviews
            .Where(r => r.RestaurantId == restaurantId)
            .Include(r => r.User)
            .OrderByDescending(r => r.DataKrijimit)
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpGet("by-user/{userId}")]
    public async Task<ActionResult<IEnumerable<Reviews>>> GetReviewsByUser(string userId)
    {
        var reviews = await _context.Reviews
            .Where(r => r.UserId == userId)
            .Include(r => r.Restaurant)
            .OrderByDescending(r => r.DataKrijimit)
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpGet("by-order/{orderId}")]
    public async Task<ActionResult<Reviews>> GetReviewByOrder(int orderId)
    {
        var review = await _context.Reviews
            .FirstOrDefaultAsync(r => r.OrderId == orderId);

        if (review == null)
        {
            return NotFound();
        }

        return review;
    }

    [HttpGet("rating/{restaurantId}")]
    public async Task<ActionResult<object>> GetRestaurantRating(int restaurantId)
    {
        var reviews = await _context.Reviews
            .Where(r => r.RestaurantId == restaurantId)
            .ToListAsync();

        if (!reviews.Any())
        {
            return Ok(new
            {
                restaurantId = restaurantId,
                averageRating = 0,
                totalReviews = 0
            });
        }

        var averageRating = reviews.Average(r => r.Vlersimi);
        var ratingDistribution = new
        {
            rating1 = reviews.Count(r => r.Vlersimi == 1),
            rating2 = reviews.Count(r => r.Vlersimi == 2),
            rating3 = reviews.Count(r => r.Vlersimi == 3),
            rating4 = reviews.Count(r => r.Vlersimi == 4),
            rating5 = reviews.Count(r => r.Vlersimi == 5)
        };

        return Ok(new
        {
            restaurantId = restaurantId,
            averageRating = Math.Round(averageRating, 1),
            totalReviews = reviews.Count,
            distribution = ratingDistribution
        });
    }

    [HttpPost]
    public async Task<ActionResult<Reviews>> CreateReview(Reviews review)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == review.OrderId);

        if (order == null)
        {
            return BadRequest("Porosia nuk ekziston");
        }

        if (order.Statusi != "Delivered")
        {
            return BadRequest("Mund të vlerësoni vetëm porositë e dorëzuara");
        }

        if (order.UserId != review.UserId)
        {
            return BadRequest("Ju mund të vlerësoni vetëm porositë tuaja");
        }

        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.OrderId == review.OrderId);

        if (existingReview != null)
        {
            return BadRequest("Kjo porosi tashmë është vlerësuar");
        }

        if (order.RestaurantId != review.RestaurantId)
        {
            return BadRequest("Restoranti nuk përputhet me porosinë");
        }

        review.DataKrijimit = DateTime.Now;

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        await UpdateRestaurantRating(review.RestaurantId);

        var createdReview = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Restaurant)
            .FirstOrDefaultAsync(r => r.Id == review.Id);

        return CreatedAtAction(nameof(GetReview), new { id = review.Id }, createdReview);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateReview(int id, Reviews review)
    {
        if (id != review.Id)
        {
            return BadRequest();
        }

        var oldReview = await _context.Reviews.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id);

        if (oldReview == null)
        {
            return NotFound();
        }

        review.DataKrijimit = oldReview.DataKrijimit;

        _context.Entry(review).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();

            await UpdateRestaurantRating(review.RestaurantId);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ReviewExists(id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
        {
            return NotFound();
        }

        var restaurantId = review.RestaurantId;

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        await UpdateRestaurantRating(restaurantId);

        return NoContent();
    }

    private async Task UpdateRestaurantRating(int restaurantId)
    {
        var averageRating = await _context.Reviews
            .Where(r => r.RestaurantId == restaurantId)
            .AverageAsync(r => (double)r.Vlersimi);

        var restaurant = await _context.Restaurants.FindAsync(restaurantId);
        if (restaurant != null)
        {
            restaurant.Rating = (decimal)Math.Round(averageRating, 1);
            await _context.SaveChangesAsync();
        }
    }

    private bool ReviewExists(int id)
    {
        return _context.Reviews.Any(e => e.Id == id);
    }
}