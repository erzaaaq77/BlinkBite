using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Metadata;

#nullable disable

namespace FoodDeliveryyy.Migrations
{
    /// <inheritdoc />
    public partial class CreateMenuItemBranchTable_Fix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MenuItemBranch",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Cmimi = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Disponueshme = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    MenuItemId = table.Column<int>(type: "int", nullable: false),
                    Perberesit = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PromotionId = table.Column<int>(type: "int", nullable: true),
                    RequestOptions = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RestaurantAddressId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItemBranch", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MenuItemBranch_MenuItems_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MenuItemBranch_RestaurantAddresses_RestaurantAddressId",
                        column: x => x.RestaurantAddressId,
                        principalTable: "RestaurantAddresses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemBranch_MenuItemId",
                table: "MenuItemBranch",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemBranch_RestaurantAddressId",
                table: "MenuItemBranch",
                column: "RestaurantAddressId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MenuItemBranch");
        }
    }
}
