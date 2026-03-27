using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodDeliveryyy.Models.Entities;

public class DeliveryDrivers
{

    [Key]
    public int Id {  get; set; }

    [Required]
    [StringLength(50)]
    public string Automjeti {  get; set; } = string.Empty;


    [Reuqired]
    [StringLength(20)]
    public string Targa { get; set; } = string.Empty;

    [Reuqired]
    [StringLength(100)]
    public string Zona {  get; set; } = string.Empty;

    [Required]

    public string Statusi {  get; set; } = "Available";

    [Range(0,5)]
    public decimal Vlersimi {  get; set; }

    [Required]
    public int UserId {  get; set; }

    [ForeignKey("UserId")]
    public virtual Order? Order {  get; set; }

    

}