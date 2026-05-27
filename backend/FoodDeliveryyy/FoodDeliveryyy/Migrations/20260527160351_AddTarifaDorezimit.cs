using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodDeliveryyy.Migrations
{
    /// <inheritdoc />
    public partial class AddTarifaDorezimit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "TarifaDorezimit",
                table: "RestaurantAddresses",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "NewDeliveryFee",
                table: "BranchModificationRequests",
                type: "decimal(65,30)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TarifaDorezimit",
                table: "RestaurantAddresses");

            migrationBuilder.DropColumn(
                name: "NewDeliveryFee",
                table: "BranchModificationRequests");
        }
    }
}
