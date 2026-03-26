using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodDeliveryyy.Models.Entities;

public class Orders {

    [Key]
    
    public int Id {  get; set; }

    [Required]
    public int UserId { get; set; } = string.Empty;

    [Required]
    public int RestaurantId { get; set; }
    [Required]
    [StringLength(500)]
    public string AdresaDorezimit {  get; set; }= string.Empty;

    [Required]
    [Column(TypeName="decimal(10,2)")]
    public decimal ShumaTotale {  get; set; }= decimal.Zero;

  
    [Column(TypeName="decimal(10,2)")]
    public decimal TarifaDorezimit { get; set; }= decimal.Zero;

    [Column(TypeName = "decimal(10,2)")]
    public decimal Zbritja { get; set; }

    [Required]
    [StringLength(50)]
    public string Statusi { get; set; } = "Pending";

    [Required]
    [StringLength(50)]
    public string MetodaPageses { get; set; } = string.Empty;

    public DateTime DataPorosis { get; set; } = DateTime.UtcNow;

    [StringLength(500)]
    public string Shenimet { get; set; } = string.Empty;

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("RestaurantId")]
    public virtual Restaurant? Restaurant { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual Delivery? Delivery { get; set; }

    public virtual Review? Review { get; set; }

}