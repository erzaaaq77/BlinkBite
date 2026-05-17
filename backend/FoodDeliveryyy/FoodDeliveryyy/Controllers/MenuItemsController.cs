using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodDeliveryyy.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles ="Merchant,Admin")]
public class MenuItemsController : ControllerBase
{
    private readonly AppDbContext _context;

    public MenuItemsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<MenuItems>>> GetMenuItems()
    {
        return await _context.MenuItems.ToListAsync();
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<MenuItems>> GetMenuItem(int id)
    {
        var menuItem = await _context.MenuItems.FindAsync(id);
        if (menuItem == null)
        {
            return NotFound();
        }
        return menuItem;
    }

    [HttpPost]
    [Authorize (Roles ="Merchant,Admin")]
    public async Task<ActionResult<MenuItems>> CreateMenuItem(MenuItems menuItem)
    {
        if (!await _context.MenuCategories.AnyAsync(c => c.Id == menuItem.CategoryId))
        {
            return BadRequest("Invalid categoryId.");
        }

        // Accept client payloads with nested category object, but persist by FK only.
        menuItem.Category = null;
        _context.MenuItems.Add(menuItem);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMenuItem), new { id = menuItem.Id }, menuItem);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Merchant,Admin")]

    public async Task<IActionResult> UpdateMenuItem(int id, MenuItems menuItem)
    {
        if (id != menuItem.Id)
        {
            return BadRequest();
        }

        if (!await _context.MenuCategories.AnyAsync(c => c.Id == menuItem.CategoryId))
        {
            return BadRequest("Invalid categoryId.");
        }

        var existing = await _context.MenuItems.FindAsync(id);
        if (existing == null)
        {
            return NotFound();
        }

        // Only update scalar fields on MenuItem; category relationship is by FK.
        existing.Emertimi = menuItem.Emertimi;
        existing.Pershkrimi = menuItem.Pershkrimi;
        existing.Cmimi = menuItem.Cmimi;
        existing.Foto = menuItem.Foto;
        existing.Disponueshme = menuItem.Disponueshme;
        existing.Alergjene = menuItem.Alergjene;
        existing.Kalori = menuItem.Kalori;
        existing.CategoryId = menuItem.CategoryId;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!MenuItemExists(id))
            {
                return NotFound();
            }
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Merchant,Admin")]

    public async Task<IActionResult> DeleteMenuItem(int id)
    {
        var menuItem = await _context.MenuItems.FindAsync(id);
        if (menuItem == null)
        {
            return NotFound();
        }

        _context.MenuItems.Remove(menuItem);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool MenuItemExists(int id)
    {
        return _context.MenuItems.Any(e => e.Id == id);
    }
}


