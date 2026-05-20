using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodDeliveryyy.Migrations
{
    public partial class AddBranchOwnership : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MerchantUserId",
                table: "RestaurantAddresses",
                type: "varchar(255)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RestaurantAddressId",
                table: "MenuItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RestaurantAddressId",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RestaurantAddressId",
                table: "Promotions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantAddresses_MerchantUserId",
                table: "RestaurantAddresses",
                column: "MerchantUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_RestaurantAddressId",
                table: "MenuItems",
                column: "RestaurantAddressId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_RestaurantAddressId",
                table: "Orders",
                column: "RestaurantAddressId");

            migrationBuilder.CreateIndex(
                name: "IX_Promotions_RestaurantAddressId",
                table: "Promotions",
                column: "RestaurantAddressId");

            migrationBuilder.AddForeignKey(
                name: "FK_RestaurantAddresses_AspNetUsers_MerchantUserId",
                table: "RestaurantAddresses",
                column: "MerchantUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_MenuItems_RestaurantAddresses_RestaurantAddressId",
                table: "MenuItems",
                column: "RestaurantAddressId",
                principalTable: "RestaurantAddresses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_RestaurantAddresses_RestaurantAddressId",
                table: "Orders",
                column: "RestaurantAddressId",
                principalTable: "RestaurantAddresses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Promotions_RestaurantAddresses_RestaurantAddressId",
                table: "Promotions",
                column: "RestaurantAddressId",
                principalTable: "RestaurantAddresses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RestaurantAddresses_AspNetUsers_MerchantUserId",
                table: "RestaurantAddresses");

            migrationBuilder.DropForeignKey(
                name: "FK_MenuItems_RestaurantAddresses_RestaurantAddressId",
                table: "MenuItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_RestaurantAddresses_RestaurantAddressId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Promotions_RestaurantAddresses_RestaurantAddressId",
                table: "Promotions");

            migrationBuilder.DropIndex(
                name: "IX_RestaurantAddresses_MerchantUserId",
                table: "RestaurantAddresses");

            migrationBuilder.DropIndex(
                name: "IX_MenuItems_RestaurantAddressId",
                table: "MenuItems");

            migrationBuilder.DropIndex(
                name: "IX_Orders_RestaurantAddressId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Promotions_RestaurantAddressId",
                table: "Promotions");

            migrationBuilder.DropColumn(
                name: "MerchantUserId",
                table: "RestaurantAddresses");

            migrationBuilder.DropColumn(
                name: "RestaurantAddressId",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "RestaurantAddressId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RestaurantAddressId",
                table: "Promotions");
        }
    }
}
