using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodDeliveryyy.Models.Entities;

public class Deliveries
{

    [Key]
    public int Id {  get; set; }

    [Reuqired]
    [StringLength(100)]
    public string Statusi {  get; set; }  = string.Empty;

    
    public DateTime? DataMarrjes { get; set; }

    public DateTime? DataDorezimit { get; set; }

    public int? KohaVlersuar {  get; set; }

    [Required]
    public int OrderId {  get; set; }

    [Required]
    public int DriverId {  get; set; }

    [ForeignKey("OrderID")]
    public virtual Order? Order { get; set; }

    [ForeignKey("DriverId")]
    public virtual DeliveryDrivers? Driver {  get; set; }



}
