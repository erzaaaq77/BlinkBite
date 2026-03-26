using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodDeliveryyy.Models.Entities;

public class Restaurant {
    [Key]
    public int Id {  get; set; }


    [Required]
    [StringLength(100)]
    public string Emertimi { get; set; } = string.Empty;

    [StringLength(500)]
    public string Pershkrimi {  get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Adresa { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Qyteti { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Telefoni { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(100)]
    public string Email {  get; set; } = string.Empty;

    public string Logo { get; set; } = string.Empty;
    
    public TimeOnly OrariHapjes {  get; set; }

    public TimeOnly OrariMbylljes { get; set; }

    [Range (0,5)]

    public decimal Rating { get; set; }

    [StringLength(20)]
    public string Statusi {  get; set; } = "Active";

    [Required]
    public string UserId {  get; set; } = string.Empty;

    [ForeignKey("UserId")]
    //virtual -> mundeson lazyloading (te dhenat i marrim veq kur na duhen)
    public virtual User? User { get; set; }

    public virtual ICollection<MenuCategory> MenuCategories { get; set; } = new List<MenuCategory>();

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    [NotMapped]

    public bool Opened
    {
        get {
            var now = TimeOnly.FromDateTime(DateTime.Now);
            return now >=OrariHapjes && now<=OrariMbylljes;
                }
    }

}

}
