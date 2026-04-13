using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Enums;
using FoodDeliveryyy.Models.Identity;
using FoodDeliveryyy.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    [Authorize(Roles ="Admin,RestaurantOwner")]
    public async Task<ActionResult<IEnumerable<Orders>>> GetOrders()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role =User.FindFirst(ClaimTypes.Role)?.Value;

        IQueryable<Orders> query = _context.Orders
            .Include(o => o.User)
            .Include(o => o.Restaurant)
            .Include(o => o.OrderItems);

            if (role == "RestaurantOwner")
        {
            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.UserId == userId);
            if (restaurant != null)
            {
                query = query.Where(o => o.RestaurantId == restaurant.Id);
            }
        }
            var orders = await query.OrderByDescending(o => o.DataPorosis).ToListAsync();
        return Ok(orders);


    }


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

        if(role !="Admin" && order.UserId !=userId && role !="RestaurantOwner")
        {
            return Forbid();
        }

        if (role == "RestaurantOwner")
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
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if(role !="Admin" && currentUserId != userId)
        {
            return Forbid();
        }

        var orders = await _context.Orders
            .Where(o => o.UserId == userId)
            .Include(o => o.Restaurant)
            .Include(o => o.OrderItems)
            .OrderByDescending(o => o.DataPorosis)
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("by-restaurant/{restaurantId}")]
    [Authorize (Roles ="Admin,RestaurantOwner")]
    public async Task<ActionResult<IEnumerable<Orders>>> GetOrdersByRestaurant(int restaurantId)
    {

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (role == "RestaurantOwner")
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
    [Authorize(Roles = "Admin,RestaurantOwner")]
    public async Task<ActionResult<IEnumerable<Orders>>> GetOrdersByStatus(string status)
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

        if (role == "RestaurantOwner")
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

        var orders = await query.ToListAsync();
        return Ok(orders);
    }

    [HttpPost]
    [Authorize(Roles ="Customer")]
    public async Task<ActionResult<Orders>> CreateOrder(Orders order)
    {
        
        var userId= User.FindFirst(ClaimTypes.NameIdentifier)?.Value;  

        order.DataPorosis = DateTime.Now;
        order.Statusi = OrderStatus.Pending;
        order.UserId = userId;

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

        var createdOrder = await _context.Orders
            .Include(o => o.Restaurant)
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == order.Id);

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, createdOrder);
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
            return BadRequest("Status is not valid. Accepted values:Pending,Accepted,Preparing,Reade,Delivered,Cancelled");
        }

        var result = await _orderService.updateOrderStatusAsync(id, parsedStatus, userId, role, request.Comment);
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
    [Authorize(Roles ="RestaurantOwner")]
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

        var result = await _orderService.updateOrderStatusAsync(id, OrderStatus.Accepted, userId, role, comment);

        if(!result) return BadRequest("Cannot accept order.Make sure order is pending");

        return Ok(new { message = "Order accepted", status = "Accepted" });
    }

    [HttpPost("{id}/prepare")]
    [Authorize (Roles = "RestaurantOwner")]
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

        var result = await _orderService.updateOrderStatusAsync(id, OrderStatus.Preparing, userId, role, comment);
        if(!result) return BadRequest("Cannot start preparing order.Make sure order is accepted");
        
        return Ok(new { message = "Order is being prepared", status = "Preparing" });
    }

    [HttpPost("{id}/ready")]
    [Authorize(Roles = "RestaurantOwner")]
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
    [Authorize(Roles = "Driver")]
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

        if (role == "Customer" && order.UserId != userId)
            return Forbid();
        if (role == "RestaurantOwner")
        {
            var restaurant = await _context.Restaurants.FirstOrDefaultAsync(r => r.UserId == userId);
            if (restaurant == null || order.RestaurantId != restaurant.Id)
                return Forbid();
        }

        if (role != "Customer" && role != "RestaurantOwner" && role != "Admin")
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

        if (role != "Admin" && order.UserId != userId && role != "RestaurantOwner" && role != "Driver")
        {
            return Forbid();
        }


        var total = await _context.OrderItems
            .Where(oi => oi.OrderId == id)
            .SumAsync(oi => oi.Sasia * oi.Cmimi);

        return Ok(new { orderId = id, total = total + order.TarifaDorezimit - order.Zbritja });
    }

    private bool OrderExists(int id)
    {
        return _context.Orders.Any(e => e.Id == id);
    }
}

public class UpdateStatusRequest
{
    public string Status { get; set; }=string.Empty;
    public string? Comment { get; set; }
}