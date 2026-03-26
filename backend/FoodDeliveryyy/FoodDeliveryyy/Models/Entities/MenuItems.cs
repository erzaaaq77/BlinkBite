using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodDeliveryyy.Models.Entities;

public class MenuItems
{

    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Emertimi { get; set; } = string.Empty;

    [StringLength(500)]
    public string Pershkrimi { get; set; } = string.Empty;

    [Required]
    //10 shifra gjithsej, 2 pas presjes dhjetore
    [Column(TypeName = "decimal(10,2)")]
    public decimal Cmimi { get; set; }

    public string? Foto { get; set; }

    public bool Disponueshme { get; set; } = true;

    [StringLength(200)]
    public string Alergjene { get; set; } = string.Empty;

    public int? Kalori { get; set; }

    [Required]
    public int CategoryId { get; set; }

    [ForeignKey("CategoryId")]
    public virtual MenuCategory Category { get; set; } = null!;
}