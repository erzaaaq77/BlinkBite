using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodDeliveryyy.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchDetailsNavigation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MenuItemBranch_MenuItems_MenuItemsId",
                table: "MenuItemBranch");

            migrationBuilder.DropIndex(
                name: "IX_MenuItemBranch_MenuItemsId",
                table: "MenuItemBranch");

            migrationBuilder.DropColumn(
                name: "MenuItemsId",
                table: "MenuItemBranch");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MenuItemsId",
                table: "MenuItemBranch",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemBranch_MenuItemsId",
                table: "MenuItemBranch",
                column: "MenuItemsId");

            migrationBuilder.AddForeignKey(
                name: "FK_MenuItemBranch_MenuItems_MenuItemsId",
                table: "MenuItemBranch",
                column: "MenuItemsId",
                principalTable: "MenuItems",
                principalColumn: "Id");
        }
    }
}
