using Microsoft.AspNetCore.Mvc;
using FoodDeliveryyy.Models.Entities;
using FoodDeliveryyy.Data;

namespace FoodDeliveryyy.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MenuItemBranchController : ControllerBase
{
    private readonly AppDbContext _context;
    public MenuItemBranchController(AppDbContext context)
    {
        _context = context;
    }

    // PUT: api/MenuItemBranch/{itemId}/branch/{branchId}
    [HttpPut("{itemId}/branch/{branchId}")]
    public IActionResult UpdateBranchMenuItem(int itemId, int branchId, [FromBody] MenuItemBranch branchData)
    {
        var mib = _context.MenuItemBranch
            .FirstOrDefault(x => x.MenuItemId == itemId && x.RestaurantAddressId == branchId);
        if (mib == null)
        {
            mib = new MenuItemBranch
            {
                MenuItemId = itemId,
                RestaurantAddressId = branchId
            };
            _context.MenuItemBranch.Add(mib);
        }
        mib.Cmimi = branchData.Cmimi;
        mib.Disponueshme = branchData.Disponueshme;
        mib.Perberesit = branchData.Perberesit;
        mib.RequestOptions = branchData.RequestOptions;
        mib.PromotionId = branchData.PromotionId;
        _context.SaveChanges();
        return Ok(mib);
    }

    // GET: api/MenuItemBranch/{itemId}/branch/{branchId}
    [HttpGet("{itemId}/branch/{branchId}")]
    public IActionResult GetBranchMenuItem(int itemId, int branchId)
    {
        var mib = _context.MenuItemBranch
            .FirstOrDefault(x => x.MenuItemId == itemId && x.RestaurantAddressId == branchId);
        if (mib == null)
            return NotFound();
        return Ok(mib);
    }
}
