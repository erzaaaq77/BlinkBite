using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FoodDeliveryyy.Models.Enums;
using FoodDeliveryyy.Models.Identity;

namespace FoodDeliveryyy.Models.Entities;

public class Orders {

    [Key]
    
    public int Id {  get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

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
    public OrderStatus Statusi { get; set; } = OrderStatus.Pending;

    [Required]
    [StringLength(50)]
    public PaymentMethod MetodaPageses { get; set; } = PaymentMethod.Cash;

    public DateTime DataPorosis { get; set; } = DateTime.UtcNow;

    [StringLength(500)]
    public string Shenimet { get; set; } = string.Empty;

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("RestaurantId")]
    public virtual Restaurant? Restaurant { get; set; }

    public virtual ICollection<OrderItems> OrderItems { get; set; } = new List<OrderItems>();

    public virtual Deliveries? Delivery { get; set; }

    public virtual Reviews? Review { get; set; }
    public DateTime? StatusiUpdatedAt { get; set; } 



}