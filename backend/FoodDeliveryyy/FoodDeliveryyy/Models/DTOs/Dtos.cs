using System.ComponentModel.DataAnnotations;

namespace FoodDeliveryyy.Models.DTOs;

public class RegisterDto
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;
}


public class LoginDto
{
    [Required]
    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}

public class OrderStatusUpdateDto
{
    [Required]
    public int OrderId { get; set; }
    [Required]
    public string? Comment { get; set; } = string.Empty;
}
