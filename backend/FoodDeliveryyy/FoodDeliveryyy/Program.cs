using FoodDeliveryyy;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var connectionString = "Server=localhost;Database=FoodDelivery;User=root;Password=";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 33)))
);

var app = builder.Build();
// test backend git
// test for commit erza

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Krijon tabelat automatikisht në MySQL
    //db.Database.EnsureCreated();

    if (!db.Users.Any(u => u.Email == "erza@example.com")) {
        db.Users.Add(new User { Name = "Erza", Email = "erza@example.com" });
        db.SaveChanges();
    }

    // Lexo dhe printo user-at
    var users = db.Users.ToList();
    foreach (var u in users)
    {
        Console.WriteLine($"User: {u.Name}, Email: {u.Email}");
    }
}
app.Run();
