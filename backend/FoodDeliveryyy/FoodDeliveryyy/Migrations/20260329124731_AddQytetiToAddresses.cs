using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodDeliveryyy.Migrations
{
    /// <inheritdoc />
    public partial class AddQytetiToAddresses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryDrivers_AspNetUsers_UserId1",
                table: "DeliveryDrivers");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryDrivers_Orders_UserId",
                table: "DeliveryDrivers");

            migrationBuilder.DropForeignKey(
                name: "FK_MenuCategories_Restaurants_RestaurantId",
                table: "MenuCategories");

            migrationBuilder.DropForeignKey(
                name: "FK_MenuItems_MenuCategories_CategoryId",
                table: "MenuItems");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryDrivers_UserId1",
                table: "DeliveryDrivers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MenuCategories",
                table: "MenuCategories");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "DeliveryDrivers");

            migrationBuilder.RenameTable(
                name: "MenuCategories",
                newName: "MenuCategory");

            migrationBuilder.RenameIndex(
                name: "IX_MenuCategories_RestaurantId",
                table: "MenuCategory",
                newName: "IX_MenuCategory_RestaurantId");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "DeliveryDrivers",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Qyteti",
                table: "Addresses",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MenuCategory",
                table: "MenuCategory",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryDrivers_AspNetUsers_UserId",
                table: "DeliveryDrivers",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MenuCategory_Restaurants_RestaurantId",
                table: "MenuCategory",
                column: "RestaurantId",
                principalTable: "Restaurants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MenuItems_MenuCategory_CategoryId",
                table: "MenuItems",
                column: "CategoryId",
                principalTable: "MenuCategory",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryDrivers_AspNetUsers_UserId",
                table: "DeliveryDrivers");

            migrationBuilder.DropForeignKey(
                name: "FK_MenuCategory_Restaurants_RestaurantId",
                table: "MenuCategory");

            migrationBuilder.DropForeignKey(
                name: "FK_MenuItems_MenuCategory_CategoryId",
                table: "MenuItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MenuCategory",
                table: "MenuCategory");

            migrationBuilder.DropColumn(
                name: "Qyteti",
                table: "Addresses");

            migrationBuilder.RenameTable(
                name: "MenuCategory",
                newName: "MenuCategories");

            migrationBuilder.RenameIndex(
                name: "IX_MenuCategory_RestaurantId",
                table: "MenuCategories",
                newName: "IX_MenuCategories_RestaurantId");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "DeliveryDrivers",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "UserId1",
                table: "DeliveryDrivers",
                type: "varchar(255)",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MenuCategories",
                table: "MenuCategories",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryDrivers_UserId1",
                table: "DeliveryDrivers",
                column: "UserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryDrivers_AspNetUsers_UserId1",
                table: "DeliveryDrivers",
                column: "UserId1",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryDrivers_Orders_UserId",
                table: "DeliveryDrivers",
                column: "UserId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MenuCategories_Restaurants_RestaurantId",
                table: "MenuCategories",
                column: "RestaurantId",
                principalTable: "Restaurants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MenuItems_MenuCategories_CategoryId",
                table: "MenuItems",
                column: "CategoryId",
                principalTable: "MenuCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
