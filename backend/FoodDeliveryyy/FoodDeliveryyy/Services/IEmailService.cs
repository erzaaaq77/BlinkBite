using FoodDeliveryyy.Models.DTOs;

namespace FoodDeliveryyy.Services;

public interface IEmailService
{
    Task SendEmailAsync(string to,string subject,string body);
    Task SendOrderStatusUpdateEmailAsync(string to, string customerName, int orderId, string oldStatus, string newStatus);
}