using Microsoft.AspNetCore.Identity;
using FoodDeliveryyy.Models.Entities;

namespace FoodDeliveryyy.Models.Identity;

public class User : IdentityUser
{


    public string? Name {  get; set; }
    public string? Lastname {  get; set; }
    public string? City { get; set; }
    public string? Address { get; set; }
    public DateTime RegisterDate {  get; set; } = DateTime.UtcNow;
    public bool Active { get; set; } = true;

    public virtual ICollection<Restaurant> Restaurants { get; set; } = new List<Restaurant>();
    public virtual ICollection<Orders> Orders { get; set; } = new List<Orders>();
    public virtual ICollection<DeliveryDrivers> DeliveryDrivers { get; set; } = new List<DeliveryDrivers>();
    public virtual ICollection<Addresses> Addresses { get; set; } = new List<Addresses>();
    public virtual ICollection<Reviews> Reviews { get; set; } = new List<Reviews>();
}