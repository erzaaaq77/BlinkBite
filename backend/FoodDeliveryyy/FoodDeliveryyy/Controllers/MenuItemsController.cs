using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodDeliveryyy.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MenuItemsController : ControllerBase
{
    private readonly AppDbContext _context;

    public MenuItemsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MenuItems>>> GetMenuItems()
    {
        return await _context.MenuItems.ToListAsync();
    }

    [HttpGet("{id}")]
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
    public async Task<ActionResult<MenuItems>> CreateMenuItem(MenuItems menuItem)
    {
        _context.MenuItems.Add(menuItem);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMenuItem), new { id = menuItem.Id }, menuItem);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMenuItem(int id, MenuItems menuItem)
    {
        if (id != menuItem.Id)
        {
            return BadRequest();
        }

        _context.Entry(menuItem).State = EntityState.Modified;

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


