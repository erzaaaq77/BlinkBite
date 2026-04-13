using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FoodDeliveryyy.Services;

public class OrderService : IOrderService
{
    private readonly AppDbContext _context;
    private readonly ILogger<OrderService> _logger;

    public OrderService(AppDbContext context, ILogger<OrderService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> UpdateOrderStatusAsync(int orderId, OrderStatus newStatus, string userId, string role, string? comment = null)
    {
        var order = await _context.Orders
            .Include(o => o.Restaurant)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) return false;

        if (role == "RestaurantOwner" && order.Restaurant.UserId != userId)
            return false;

        bool isValidTransition = (order.Statusi, newStatus) switch
        {
            (OrderStatus.Pending, OrderStatus.Accepted) => role == "RestaurantOwner",
            (OrderStatus.Accepted, OrderStatus.Preparing) => role == "RestaurantOwner",
            (OrderStatus.Preparing, OrderStatus.Ready) => role == "RestaurantOwner",
            (OrderStatus.Ready, OrderStatus.Delivered) => role == "Driver",
            (_, OrderStatus.Cancelled) => role == "Customer" || role == "RestaurantOwner",
            _ => false
        };

        if (!isValidTransition)
            return false;

        order.Statusi = newStatus;
        order.StatusiUpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Order {OrderId} status changed to {NewStatus}", orderId, newStatus);
        return true;
    }
}