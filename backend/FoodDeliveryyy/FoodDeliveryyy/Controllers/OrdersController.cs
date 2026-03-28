using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodDeliveryyy.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;

    public OrdersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Orders>>> GetOrders()
    {
        return await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Restaurant)
            .Include(o => o.OrderItems)
            .OrderByDescending(o => o.DataPorosis)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Orders>> GetOrder(int id)
    {
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

        return order;
    }

    [HttpGet("by-user/{userId}")]
    public async Task<ActionResult<IEnumerable<Orders>>> GetOrdersByUser(string userId)
    {
        var orders = await _context.Orders
            .Where(o => o.UserId == userId)
            .Include(o => o.Restaurant)
            .Include(o => o.OrderItems)
            .OrderByDescending(o => o.DataPorosis)
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("by-restaurant/{restaurantId}")]
    public async Task<ActionResult<IEnumerable<Orders>>> GetOrdersByRestaurant(int restaurantId)
    {
        var orders = await _context.Orders
            .Where(o => o.RestaurantId == restaurantId)
            .Include(o => o.User)
            .Include(o => o.OrderItems)
            .OrderByDescending(o => o.DataPorosis)
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("by-status/{status}")]
    public async Task<ActionResult<IEnumerable<Orders>>> GetOrdersByStatus(string status)
    {
        if (!Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
        {
            return BadRequest("Statusi nuk është valid");
        }

        var orders = await _context.Orders
            .Where(o => o.Statusi == parsedStatus)
            .Include(o => o.Restaurant)
            .Include(o => o.User)
            .OrderByDescending(o => o.DataPorosis)
            .ToListAsync();

        return Ok(orders);
    }

    [HttpPost]
    public async Task<ActionResult<Orders>> CreateOrder(Orders order)
    {
        // Vendos datën e porosisë
        order.DataPorosis = DateTime.Now;
        order.Statusi = OrderStatus.Pending;

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var createdOrder = await _context.Orders
            .Include(o => o.Restaurant)
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == order.Id);

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, createdOrder);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] string status)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
        {
            return NotFound();
        }

        if (!Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
        {
            return BadRequest("Statusi nuk është valid");
        }

        order.Statusi = parsedStatus;
        await _context.SaveChangesAsync();

        return Ok(new { id = order.Id, statusi = order.Statusi.ToString() });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateOrder(int id, Orders order)
    {
        if (id != order.Id)
        {
            return BadRequest();
        }

        _context.Entry(order).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!OrderExists(id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
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

    [HttpGet("total/{id}")]
    public async Task<ActionResult<decimal>> GetOrderTotal(int id)
    {
        var total = await _context.OrderItems
            .Where(oi => oi.OrderId == id)
            .SumAsync(oi => oi.Sasia * oi.Cmimi);

        return Ok(total);
    }

    private bool OrderExists(int id)
    {
        return _context.Orders.Any(e => e.Id == id);
    }
}