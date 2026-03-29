using FoodDeliveryyy.Data;
using FoodDeliveryyy.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodDeliveryyy.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AddressesController : ControllerBase
{
    private readonly AppDbContext _context;

    public AddressesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Addresses>>> GetAddresses()
    {
        return await _context.Addresses
            .Include(a => a.User)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Addresses>> GetAddress(int id)
    {
        var address = await _context.Addresses
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (address == null)
        {
            return NotFound();
        }

        return address;
    }

    [HttpGet("by-user/{userId}")]
    public async Task<ActionResult<IEnumerable<Addresses>>> GetAddressesByUser(string userId)
    {
        var addresses = await _context.Addresses
            .Where(a => a.UserId == userId)
            .ToListAsync();

        return Ok(addresses);
    }

    [HttpGet("primary/{userId}")]
    public async Task<ActionResult<Addresses>> GetPrimaryAddress(string userId)
    {
        var primaryAddress = await _context.Addresses
            .FirstOrDefaultAsync(a => a.UserId == userId && a.EshteKryesore == true);

        if (primaryAddress == null)
        {
            return NotFound("Nuk ka adresë kryesore për këtë përdorues");
        }

        return Ok(primaryAddress);
    }

    [HttpGet("by-city/{city}")]
    public async Task<ActionResult<IEnumerable<Addresses>>> GetAddressesByCity(string city)
    {
        var addresses = await _context.Addresses
            .Where(a => a.Qyteti == city)
            .Include(a => a.User)
            .ToListAsync();

        return Ok(addresses);
    }

    [HttpPost]
    public async Task<ActionResult<Addresses>> CreateAddress(Addresses address)
    {
        var user = await _context.Users.FindAsync(address.UserId);
        if (user == null)
        {
            return BadRequest("Përdoruesi nuk ekziston");
        }

        if (address.EshteKryesore)
        {
            var existingPrimary = await _context.Addresses
                .FirstOrDefaultAsync(a => a.UserId == address.UserId && a.EshteKryesore == true);

            if (existingPrimary != null)
            {
                existingPrimary.EshteKryesore = false;
            }
        }

        _context.Addresses.Add(address);
        await _context.SaveChangesAsync();

        var createdAddress = await _context.Addresses
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == address.Id);

        return CreatedAtAction(nameof(GetAddress), new { id = address.Id }, createdAddress);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAddress(int id, Addresses address)
    {
        if (id != address.Id)
        {
            return BadRequest();
        }

        if (address.EshteKryesore)
        {
            var existingPrimary = await _context.Addresses
                .FirstOrDefaultAsync(a => a.UserId == address.UserId && a.EshteKryesore == true && a.Id != id);

            if (existingPrimary != null)
            {
                existingPrimary.EshteKryesore = false;
            }
        }

        _context.Entry(address).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!AddressExists(id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    [HttpPatch("{id}/set-primary")]
    public async Task<IActionResult> SetPrimaryAddress(int id)
    {
        var address = await _context.Addresses.FindAsync(id);
        if (address == null)
        {
            return NotFound();
        }

        var userAddresses = await _context.Addresses
            .Where(a => a.UserId == address.UserId)
            .ToListAsync();

        foreach (var addr in userAddresses)
        {
            addr.EshteKryesore = (addr.Id == id);
        }

        await _context.SaveChangesAsync();

        return Ok(new { id = address.Id, eshteKryesore = true });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAddress(int id)
    {
        var address = await _context.Addresses.FindAsync(id);
        if (address == null)
        {
            return NotFound();
        }

        var wasPrimary = address.EshteKryesore;
        var userId = address.UserId;

        _context.Addresses.Remove(address);
        await _context.SaveChangesAsync();

        if (wasPrimary)
        {
            var anotherAddress = await _context.Addresses
                .FirstOrDefaultAsync(a => a.UserId == userId);

            if (anotherAddress != null)
            {
                anotherAddress.EshteKryesore = true;
                await _context.SaveChangesAsync();
            }
        }

        return NoContent();
    }

    [HttpGet("count/{userId}")]
    public async Task<ActionResult<int>> GetAddressCount(string userId)
    {
        var count = await _context.Addresses
            .Where(a => a.UserId == userId)
            .CountAsync();

        return Ok(count);
    }

    private bool AddressExists(int id)
    {
        return _context.Addresses.Any(e => e.Id == id);
    }
}