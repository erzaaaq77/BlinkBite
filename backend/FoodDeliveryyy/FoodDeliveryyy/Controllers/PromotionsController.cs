using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Enums;
using FoodDeliveryyy.Models.Identity;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodDeliveryyy.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PromotionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PromotionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Promotions>>> GetPromotions()
    {
        return await _context.Promotions
            .Include(p => p.Restaurant)
            .OrderByDescending(p => p.DataFillimit)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Promotions>> GetPromotion(int id)
    {
        var promotion = await _context.Promotions
            .Include(p => p.Restaurant)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (promotion == null)
        {
            return NotFound();
        }

        return promotion;
    }

    [HttpGet("by-restaurant/{restaurantId}")]
    public async Task<ActionResult<IEnumerable<Promotions>>> GetPromotionsByRestaurant(int restaurantId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = AppRoles.Normalize(User.FindFirst(ClaimTypes.Role)?.Value);

        if (role == AppRoles.Merchant)
        {
            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.Id == restaurantId && r.UserId == userId);
            if (restaurant == null)
            {
                return Forbid();
            }
        }

        if (role == AppRoles.BranchManager)
        {
            var hasBranchAccess = await _context.RestaurantAddresses
                .AnyAsync(a => a.RestaurantId == restaurantId && a.MerchantUserId == userId);
            if (!hasBranchAccess)
            {
                return Forbid();
            }
        }

        var promotions = await _context.Promotions
            .Where(p => p.RestaurantId == restaurantId)
            .Include(p => p.Restaurant)
            .OrderByDescending(p => p.DataFillimit)
            .ToListAsync();

        return Ok(promotions);
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<Promotions>>> GetActivePromotions()
    {
        var tani = DateTime.Now;

        var promotions = await _context.Promotions
            .Where(p => p.Statusi == PromotionStatus.Active &&
                        p.DataFillimit <= tani &&
                        p.DataPerfundimit >= tani)
            .Include(p => p.Restaurant)
            .ToListAsync();

        return Ok(promotions);
    }

    [HttpGet("active/by-restaurant/{restaurantId}")]
    public async Task<ActionResult<IEnumerable<Promotions>>> GetActivePromotionsByRestaurant(int restaurantId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = AppRoles.Normalize(User.FindFirst(ClaimTypes.Role)?.Value);

        if (role == AppRoles.Merchant)
        {
            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.Id == restaurantId && r.UserId == userId);
            if (restaurant == null)
            {
                return Forbid();
            }
        }

        if (role == AppRoles.BranchManager)
        {
            var hasBranchAccess = await _context.RestaurantAddresses
                .AnyAsync(a => a.RestaurantId == restaurantId && a.MerchantUserId == userId);
            if (!hasBranchAccess)
            {
                return Forbid();
            }
        }

        var tani = DateTime.Now;

        var promotions = await _context.Promotions
            .Where(p => p.RestaurantId == restaurantId &&
                        p.Statusi == PromotionStatus.Active &&
                        p.DataFillimit <= tani &&
                        p.DataPerfundimit >= tani)
            .ToListAsync();

        return Ok(promotions);
    }

    [HttpGet("validate/{restaurantId}/{kodi}")]
    public async Task<ActionResult<object>> ValidatePromoCode(int restaurantId, string kodi)
    {
        var tani = DateTime.Now;

        var promotion = await _context.Promotions
            .FirstOrDefaultAsync(p => p.RestaurantId == restaurantId &&
                                       p.Kodi == kodi &&
                                       p.Statusi == PromotionStatus.Active &&
                                       p.DataFillimit <= tani &&
                                       p.DataPerfundimit >= tani);

        if (promotion == null)
        {
            return NotFound(new
            {
                valid = false,
                message = "Kodi promocional nuk është valid ose ka skaduar"
            });
        }

        return Ok(new
        {
            valid = true,
            zbritjaPerqind = promotion.ZbritjaPerqind,
            zbritjaMax = promotion.ZbritjaMax,
            message = $"Kodi valid! Zbritje {promotion.ZbritjaPerqind}%"
        });
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Merchant + "," + AppRoles.BranchManager + "," + AppRoles.Admin)]
    public async Task<ActionResult<Promotions>> CreatePromotion(Promotions promotion)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = AppRoles.Normalize(User.FindFirst(ClaimTypes.Role)?.Value);

        var restaurant = await _context.Restaurants.FindAsync(promotion.RestaurantId);
        if (restaurant == null)
        {
            return BadRequest("Restoranti nuk ekziston");
        }

        if (role == AppRoles.Merchant && restaurant.UserId != userId)
        {
            return Forbid();
        }

        if (role == AppRoles.BranchManager && !promotion.RestaurantAddressId.HasValue)
        {
            return BadRequest("Branch managers must provide restaurantAddressId.");
        }

        if (promotion.RestaurantAddressId.HasValue)
        {
            var address = await _context.RestaurantAddresses.FirstOrDefaultAsync(a => a.Id == promotion.RestaurantAddressId.Value);
            if (address == null || address.RestaurantId != restaurant.Id)
            {
                return BadRequest("Restaurant address does not exist");
            }

            if (role == AppRoles.BranchManager && address.MerchantUserId != userId)
            {
                return Forbid();
            }
        }

        var existingPromo = await _context.Promotions
            .FirstOrDefaultAsync(p => p.RestaurantId == promotion.RestaurantId && p.Kodi == promotion.Kodi);

        if (existingPromo != null)
        {
            return BadRequest("Ky kod promocional tashmë ekziston për këtë restorant");
        }

        if (promotion.DataFillimit >= promotion.DataPerfundimit)
        {
            return BadRequest("Data e fillimit duhet të jetë para datës së përfundimit");
        }

        var tani = DateTime.Now;
        if (promotion.DataFillimit <= tani && promotion.DataPerfundimit >= tani)
        {
            promotion.Statusi = PromotionStatus.Active;
        }
        else if (promotion.DataPerfundimit < tani)
        {
            promotion.Statusi = PromotionStatus.Expired;
        }
        else
        {
            promotion.Statusi = PromotionStatus.Inactive;
        }

        _context.Promotions.Add(promotion);
        await _context.SaveChangesAsync();

        var createdPromotion = await _context.Promotions
            .Include(p => p.Restaurant)
            .FirstOrDefaultAsync(p => p.Id == promotion.Id);

        return CreatedAtAction(nameof(GetPromotion), new { id = promotion.Id }, createdPromotion);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = AppRoles.Merchant + "," + AppRoles.BranchManager + "," + AppRoles.Admin)]
    public async Task<IActionResult> UpdatePromotion(int id, Promotions promotion)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = AppRoles.Normalize(User.FindFirst(ClaimTypes.Role)?.Value);

        if (id != promotion.Id)
        {
            return BadRequest();
        }

        var restaurant = await _context.Restaurants.FindAsync(promotion.RestaurantId);
        if (restaurant == null)
        {
            return BadRequest("Restoranti nuk ekziston");
        }

        if (role == AppRoles.Merchant && restaurant.UserId != userId)
        {
            return Forbid();
        }

        if (role == AppRoles.BranchManager && !promotion.RestaurantAddressId.HasValue)
        {
            return BadRequest("Branch managers must provide restaurantAddressId.");
        }

        if (promotion.RestaurantAddressId.HasValue)
        {
            var address = await _context.RestaurantAddresses.FirstOrDefaultAsync(a => a.Id == promotion.RestaurantAddressId.Value);
            if (restaurant == null || address == null || address.RestaurantId != restaurant.Id)
            {
                return BadRequest("Restaurant address does not exist");
            }

            if (role == AppRoles.BranchManager && address.MerchantUserId != userId)
            {
                return Forbid();
            }
        }

        if (promotion.DataFillimit >= promotion.DataPerfundimit)
        {
            return BadRequest("Data e fillimit duhet të jetë para datës së përfundimit");
        }

        var tani = DateTime.Now;
        if (promotion.DataFillimit <= tani && promotion.DataPerfundimit >= tani)
        {
            promotion.Statusi = PromotionStatus.Active;
        }
        else if (promotion.DataPerfundimit < tani)
        {
            promotion.Statusi = PromotionStatus.Expired;
        }
        else
        {
            promotion.Statusi = PromotionStatus.Inactive;
        }

        _context.Entry(promotion).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!PromotionExists(id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = AppRoles.Merchant + "," + AppRoles.BranchManager + "," + AppRoles.Admin)]
    public async Task<IActionResult> UpdatePromotionStatus(int id, [FromBody] PromotionStatus status)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = AppRoles.Normalize(User.FindFirst(ClaimTypes.Role)?.Value);

        var promotion = await _context.Promotions.FindAsync(id);
        if (promotion == null)
        {
            return NotFound();
        }

        if (role == AppRoles.Merchant)
        {
            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.Id == promotion.RestaurantId);
            if (restaurant == null || restaurant.UserId != userId)
            {
                return Forbid();
            }
        }

        if (role == AppRoles.BranchManager)
        {
            if (!promotion.RestaurantAddressId.HasValue)
            {
                return Forbid();
            }

            var address = await _context.RestaurantAddresses.FirstOrDefaultAsync(a => a.Id == promotion.RestaurantAddressId.Value);
            if (address == null || address.MerchantUserId != userId)
            {
                return Forbid();
            }
        }

        if (!Enum.IsDefined(typeof(PromotionStatus), status))
        {
            return BadRequest("Statusi duhet të jetë: Active, Expired, ose Inactive");
        }

        promotion.Statusi = status;
        await _context.SaveChangesAsync();

        return Ok(new { id = promotion.Id, statusi = promotion.Statusi.ToString() });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = AppRoles.Merchant + "," + AppRoles.BranchManager + "," + AppRoles.Admin)]
    public async Task<IActionResult> DeletePromotion(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = AppRoles.Normalize(User.FindFirst(ClaimTypes.Role)?.Value);

        var promotion = await _context.Promotions.FindAsync(id);
        if (promotion == null)
        {
            return NotFound();
        }

        if (role == AppRoles.Merchant)
        {
            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.Id == promotion.RestaurantId);
            if (restaurant == null || restaurant.UserId != userId)
            {
                return Forbid();
            }
        }

        if (role == AppRoles.BranchManager)
        {
            if (!promotion.RestaurantAddressId.HasValue)
            {
                return Forbid();
            }

            var address = await _context.RestaurantAddresses.FirstOrDefaultAsync(a => a.Id == promotion.RestaurantAddressId.Value);
            if (address == null || address.MerchantUserId != userId)
            {
                return Forbid();
            }
        }

        _context.Promotions.Remove(promotion);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("expired")]
    public async Task<ActionResult<IEnumerable<Promotions>>> GetExpiredPromotions()
    {
        var tani = DateTime.Now;

        var promotions = await _context.Promotions
            .Where(p => p.DataPerfundimit < tani || p.Statusi == PromotionStatus.Expired)
            .Include(p => p.Restaurant)
            .ToListAsync();

        return Ok(promotions);
    }

    private bool PromotionExists(int id)
    {
        return _context.Promotions.Any(e => e.Id == id);
    }
}