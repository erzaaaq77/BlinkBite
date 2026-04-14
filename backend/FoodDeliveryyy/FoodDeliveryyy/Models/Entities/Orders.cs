using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FoodDeliveryyy.Models.Enums;
using FoodDeliveryyy.Models.Identity;

namespace FoodDeliveryyy.Models.Entities;

public class Orders : IValidatableObject{

    [Key]
    public int Id {  get; set; }

    [Required (ErrorMessage = "UserId is required")]
    public string UserId { get; set; } = string.Empty;

    [Required (ErrorMessage = "RestaurantId is required")]
    public int RestaurantId { get; set; }
    [Required (ErrorMessage = "Delivery Address is required")]
    [StringLength(500, MinimumLength =5,ErrorMessage = "Address must be at least 5 characters long.")]

    [RegularExpression(@"[a-zA-Z0-9\s,.-]+", ErrorMessage = "Address contains invalid characters.")]
    public string AdresaDorezimit {  get; set; }= string.Empty;

    [Required(ErrorMessage = "Total Amount is required")]
    [Range(0.01, 99999.99,ErrorMessage ="Total Amount must be between 0.01 and 99999.99")]

    [Column(TypeName="decimal(10,2)")]
    public decimal ShumaTotale {  get; set; }= decimal.Zero;


    [Range(0, 99.99, ErrorMessage = "Delivery Fee must be between 0 and 99.99")]
    [Column(TypeName="decimal(10,2)")]
    public decimal TarifaDorezimit { get; set; }= decimal.Zero;

    [Range(0, double.MaxValue, ErrorMessage = "Discount must be between 0 and 99.99")]
    //// qetu ke met 
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