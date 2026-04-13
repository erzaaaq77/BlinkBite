using FoodDeliveryyy.Models.Enums;

namespace FoodDeliveryyy.Services;

public interface IOrderService
{
    Task<bool> UpdateOrderStatusAsync(int orderid, OrderStatus newStatus, string userId, string role, string? comment = null);
}


