using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodDeliveryyy.Models.Entities;


public class Reviews
{
    [Key]
    public int Id {  get; set; }

    [Required]
    public int OrderId {  get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public int RestaurantId {  get; set; }

    [Range(0,5)]
    public decimal Vlersimi {  get; set; }

    [StringLength(300)]
    public string Komenti {  get; set; }= string.Empty;

    public DateTime DataKrijimit {  get; set; }

    [ForeignKey("OrderId")]
    public  virtual Orders? Order {  get; set; }

    [ForeignKey("UserId")]
    public  virtual Identity.Users? User { get; set; }
     
}