using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Enums;
using FoodDeliveryyy.Models.Identity;
using FoodDeliveryyy.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure.Internal;
using Microsoft.Extensions.Configuration.UserSecrets;
using System.Data;
using System.Security.Claims;


namespace FoodDeliveryyy.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IOrderService _orderService;
    public OrdersController(AppDbContext context,IOrderService orderService)
    {
        _context = context;
        _orderService = orderService;
    }

    [HttpGet]
    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Merchant)]
    public async Task<ActionResult<IEnumerable<Orders>>> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10
        )

        
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        IQueryable<Orders> query = _context.Orders
            .Include(o => o.User)
            .Include(o => o.Restaurant)
            .Include(o => o.OrderItems);

        if (role == AppRoles.Merchant)
        {
            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.UserId == userId);
            if (restaurant != null)
            {
                query = query.Where(o => o.RestaurantId == restaurant.Id);
            }
        }
        var totalCount= await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var orders = await query.OrderByDescending(o => o.DataPorosis).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(
            new { 
            Data = orders,
            Pagination=new { 
            CurrentPage=page,
            PageSize=pageSize,
            TotalCount=totalCount,
            TotalPages=totalPages,
            HasPrevious = page >1,
            HasNext = page < totalPages
            }
            });


    }

    [Authorize]
    [HttpGet("{id}")]
    
    public async Task<ActionResult<Orders>> GetOrder(int id)
    {
        var userId=User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        var order = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Restaurant)
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        if (role != AppRoles.Admin && order.UserId != userId && role != AppRoles.Merchant)
        {
            return Forbid();
        }

        if (role == AppRoles.Merchant)
        {
            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.UserId == userId);
            if (restaurant == null || order.RestaurantId != restaurant.Id)
            {
                return Forbid();
            }
        }
        return order;
    }

    [HttpGet("by-user/{userId}")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<Orders>>> GetOrdersByUser(string userId)
    {
        var currentUserId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
            User.FindFirst("sub")?.Value ??
            User.FindFirst("id")?.Value ??
            User.FindFirst("userId")?.Value;

        var role =
            User.FindFirst(ClaimTypes.Role)?.Value ??
            User.FindFirst("role")?.Value;

        if (role != AppRoles.Admin && currentUserId != userId)
        {
            return Forbid();
        }

        var orders = await _context.Orders
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.DataPorosis)
            .Select(o => new
            {
                id = o.Id,
                userId = o.UserId,
                restaurantId = o.RestaurantId,
                adresaDorezimit = o.AdresaDorezimit,
                shumaTotale = o.ShumaTotale,
                tarifaDorezimit = o.TarifaDorezimit,
                zbritja = o.Zbritja,
                statusi = o.Statusi.ToString(),
                metodaPageses = o.MetodaPageses.ToString(),
                dataPorosis = o.DataPorosis,
                shenimet = o.Shenimet,
                restaurant = o.Restaurant == null ? null : new
                {
                    id = o.Restaurant.Id,
                    emertimi = o.Restaurant.Emertimi,
                },
                orderItems = o.OrderItems.Select(oi => new
                {
                    id = oi.Id,
                    menuItemId = oi.MenuItemId,
                    sasia = oi.Sasia,
                    cmimi = oi.Cmimi,
                    shenimet = oi.Shenimet,
                }).ToList(),
            })
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<Orders>>> GetMyOrders()
    {
        var userId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
            User.FindFirst("sub")?.Value ??
            User.FindFirst("id")?.Value ??
            User.FindFirst("userId")?.Value;

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized("User identity is missing.");
        }

        var orders = await _context.Orders
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.DataPorosis)
            .Select(o => new
            {
                id = o.Id,
                userId = o.UserId,
                restaurantId = o.RestaurantId,
                adresaDorezimit = o.AdresaDorezimit,
                shumaTotale = o.ShumaTotale,
                tarifaDorezimit = o.TarifaDorezimit,
                zbritja = o.Zbritja,
                statusi = o.Statusi.ToString(),
                metodaPageses = o.MetodaPageses.ToString(),
                dataPorosis = o.DataPorosis,
                shenimet = o.Shenimet,
                restaurant = o.Restaurant == null ? null : new
                {
                    id = o.Restaurant.Id,
                    emertimi = o.Restaurant.Emertimi,
                },
                orderItems = o.OrderItems.Select(oi => new
                {
                    id = oi.Id,
                    menuItemId = oi.MenuItemId,
                    sasia = oi.Sasia,
                    cmimi = oi.Cmimi,
                    shenimet = oi.Shenimet,
                }).ToList(),
            })
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("by-restaurant/{restaurantId}")]
    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Merchant)]
    public async Task<ActionResult<IEnumerable<Orders>>> GetOrdersByRestaurant(int restaurantId)
    {

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (role == AppRoles.Merchant)
        {
            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.UserId == userId);
            if (restaurant == null || restaurant.Id != restaurantId)
            {
                return Forbid();
            }
        }

        var orders = await _context.Orders
            .Where(o => o.RestaurantId == restaurantId)
            .Include(o => o.User)
            .Include(o => o.OrderItems)
            .OrderByDescending(o => o.DataPorosis)
            .ToListAsync();

        return Ok(orders);
    }


    [HttpGet("by-status/{status}")]
    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Merchant)]
    public async Task<ActionResult<IEnumerable<Orders>>> GetOrdersByStatus(string status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10
        )
    {
        if (!Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
        {
            return BadRequest("Status is not valid. Allowed values: Pending, Accepted, Preparing, Ready, Delivered, Cancelled.");
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        IQueryable<Orders> query = _context.Orders
            .Where(o => o.Statusi == parsedStatus)
            .Include(o => o.Restaurant)
            .Include(o => o.User)
            .OrderByDescending(o => o.DataPorosis);

        if (role == AppRoles.Merchant)
        {
            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.UserId == userId);
            if (restaurant != null) 
            {
                query = query.Where(o => o.RestaurantId == restaurant.Id);
            }
            else
            {
                
                return Ok(new List<Orders>());
            }
        }

        var totalCount = await query.CountAsync();
        var orders=await query.Skip((page -1)*pageSize).Take(pageSize).ToListAsync();
        return Ok(
            new { 
            Data = orders,
            Pagination =new { 
            
            CurrentPage= page,
            PageSize=pageSize,
            totalCount=totalCount,
            TotalPages=(int)Math.Ceiling(totalCount/(double)pageSize)
            }
            }
            );
    }

    [HttpPost]
    [Authorize(Roles ="Customer")]
    public async Task<ActionResult<Orders>> CreateOrder(Orders order)
    {
        var userId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
            User.FindFirst("sub")?.Value ??
            User.FindFirst("id")?.Value ??
            User.FindFirst("userId")?.Value;

        if (string.IsNullOrWhiteSpace(userId) && string.IsNullOrWhiteSpace(order.UserId))
        {
            return Unauthorized("User identity is missing for this order.");
        }

        order.DataPorosis = DateTime.Now;
        order.Statusi = OrderStatus.Pending;
        order.UserId = !string.IsNullOrWhiteSpace(userId) ? userId : order.UserId;

        var restaurant = await _context.Restaurants.FindAsync(order.RestaurantId);
        if(restaurant==null)
        {
            return NotFound("Restaurant not found");
        }
        if(order.ShumaTotale==0 && order.OrderItems.Any())
        { order.ShumaTotale = order.OrderItems.Sum(oi => oi.Sasia * oi.Cmimi) + order.TarifaDorezimit - order.Zbritja;
        
        }

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var createdOrderResponse = new
        {
            id = order.Id,
            userId = order.UserId,
            restaurantId = order.RestaurantId,
            adresaDorezimit = order.AdresaDorezimit,
            shumaTotale = order.ShumaTotale,
            tarifaDorezimit = order.TarifaDorezimit,
            zbritja = order.Zbritja,
            statusi = order.Statusi.ToString(),
            metodaPageses = order.MetodaPageses.ToString(),
            dataPorosis = order.DataPorosis,
            shenimet = order.Shenimet,
            orderItems = order.OrderItems.Select(oi => new
            {
                menuItemId = oi.MenuItemId,
                sasia = oi.Sasia,
                cmimi = oi.Cmimi,
                shenimet = oi.Shenimet,
            }).ToList(),
        };

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, createdOrderResponse);
    }

    [HttpPut("{id}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;


        var order = await _context.Orders.FindAsync(id);
        if (order == null)
        {
            return NotFound();
        }

        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var parsedStatus))
        {
            return BadRequest("Status is not valid. Accepted values:Pending,Accepted,Preparing,Ready,Delivered,Cancelled");
        }

        var result = await _orderService.UpdateOrderStatusAsync(id, parsedStatus, userId, role, request.Comment);
        if (!result)
        {
            return BadRequest("Status update not allowed or order not found");
        }
        return Ok(new
        {
            id = id,
            statusi = parsedStatus.ToString(),
            updatedAt = DateTime.UtcNow,
        }
            );
    }
    
        
    

    [HttpPost("{id}/accept")]
    [Authorize(Roles = AppRoles.Merchant)]
    public async Task<IActionResult> AcceptOrder(int id, [FromBody] string? comment = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role= User.FindFirst(ClaimTypes.Role)?.Value;

        var order=await _context.Orders.Include(o => o.Restaurant).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null)
        {
            return NotFound();
        }
        var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.UserId == userId);
        if(restaurant == null || order.RestaurantId != restaurant.Id)
        {
            return Forbid();
        }

        var result = await _orderService.UpdateOrderStatusAsync(id, OrderStatus.Accepted, userId, role, comment);

        if(!result) return BadRequest("Cannot accept order.Make sure order is pending");

        return Ok(new { message = "Order accepted", status = "Accepted" });
    }

    [HttpPost("{id}/prepare")]
    [Authorize(Roles = AppRoles.Merchant)]
    public async Task<IActionResult> StartPreparing (int id, [FromBody] string? comment = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        var order= await _context.Orders.Include(o => o.Restaurant).FirstOrDefaultAsync(o => o.Id == id);

        if(order == null) { return NotFound(); }

        var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.UserId == userId);
        if(restaurant == null || order.RestaurantId != restaurant.Id)
        {
            return Forbid();
        }

        var result = await _orderService.UpdateOrderStatusAsync(id, OrderStatus.Preparing, userId, role, comment);
        if(!result) return BadRequest("Cannot start preparing order.Make sure order is accepted");
        
        return Ok(new { message = "Order is being prepared", status = "Preparing" });
    }

    [HttpPost("{id}/ready")]
    [Authorize(Roles = AppRoles.Merchant)]
    public async Task<IActionResult> MarkAsReady(int id, [FromBody] string? comment = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        var order = await _context.Orders.Include(o => o.Restaurant).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.UserId == userId);
        if (restaurant == null || order.RestaurantId != restaurant.Id)
        {
            return Forbid();
        }
        var result = await _orderService.UpdateOrderStatusAsync(id, OrderStatus.Ready, userId, role, comment);

        if (!result) return BadRequest("Cannot mark as ready. Order must be preparing first.");

        return Ok(new { message = "Order is ready for delivery", status = "Ready" });
    }

    [HttpPost("{id}/deliver")]
    [Authorize(Roles = AppRoles.Courier)]
    public async Task<IActionResult> DeliverOrder(int id, [FromBody] string? comment = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        var result = await _orderService.UpdateOrderStatusAsync(id, OrderStatus.Delivered, userId, role, comment);

        if (!result) return BadRequest("Cannot deliver order. Order must be ready first.");

        return Ok(new { message = "Order delivered successfully", status = "Delivered" });
    }

    [HttpPost("{id}/cancel")]
    [Authorize]
    public async Task<IActionResult> CancelOrder(int id, [FromBody] string? comment = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        var order = await _context.Orders
            .Include(o => o.Restaurant)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return NotFound();

        if (order.Statusi != OrderStatus.Pending)
            return BadRequest("Only pending orders can be cancelled");

        if (role == AppRoles.Customer && order.UserId != userId)
            return Forbid();
        if (role == AppRoles.Merchant)
        {
            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.UserId == userId);
            if (restaurant == null || order.RestaurantId != restaurant.Id)
                return Forbid();
        }

        if (role != AppRoles.Customer && role != AppRoles.Merchant && role != AppRoles.Admin)
            return Forbid();

        var result = await _orderService.UpdateOrderStatusAsync(id, OrderStatus.Cancelled, userId, role, comment);

        if (!result) return BadRequest("Cannot cancel order");

        return Ok(new { message = "Order cancelled", status = "Cancelled" });
    }

 

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteOrder(int id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
        {
            return NotFound();
        }

        var orderItems = await _context.OrderItems.Where(oi => oi.OrderId == id).ToListAsync();
        _context.OrderItems.RemoveRange(orderItems);

        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id}/total")]
    [Authorize]
    public async Task<ActionResult<decimal>> GetOrderTotal(int id)

    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        var order = await _context.Orders.FindAsync(id);

        if (order == null) return NotFound();

        if (role != AppRoles.Admin && order.UserId != userId && role != AppRoles.Merchant && role != AppRoles.Courier)
        {
            return Forbid();
        }


        var total = await _context.OrderItems
            .Where(oi => oi.OrderId == id)
            .SumAsync(oi => oi.Sasia * oi.Cmimi);

        return Ok(new { orderId = id, total = total + order.TarifaDorezimit - order.Zbritja });
    }

    [HttpGet("{id}/history")]
    public async Task<IActionResult> GetHistory(int id)
    {
        if (!await _orderService.OrderExistsAsync(id))
            return NotFound($"Order with ID {id} not found");

        var history = await _orderService.GetOrderHistoryAsync(id);
        return Ok(history);
    }



}

public class UpdateStatusRequest
{
    public string Status { get; set; }=string.Empty;
    public string? Comment { get; set; }
}