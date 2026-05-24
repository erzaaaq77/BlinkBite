using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodDeliveryyy.Models.Entities;

public class MenuItemBranch
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int MenuItemId { get; set; }

    [Required]
    public int RestaurantAddressId { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? Cmimi { get; set; } // Çmimi specifik për branch

    public bool? Disponueshme { get; set; } // Statusi për branch

    public string? Perberesit { get; set; } // Përbërësit për branch

    public string? RequestOptions { get; set; } // Request options për branch

    public int? PromotionId { get; set; } // Oferta specifike për branch

    [ForeignKey("MenuItemId")]
    public virtual MenuItems? MenuItem { get; set; }

    [ForeignKey("RestaurantAddressId")]
    public virtual RestaurantAddress? RestaurantAddress { get; set; }
}
