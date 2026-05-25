using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodDeliveryyy.Migrations
{
    /// <inheritdoc />
    public partial class AddMenuItemBranchFinal : Migration
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
                    MenuItemId = table.Column<int>(type: "int", nullable: false),
                    RestaurantAddressId = table.Column<int>(type: "int", nullable: false),
                    Cmimi = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Disponueshme = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    Perberesit = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequestOptions = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PromotionId = table.Column<int>(type: "int", nullable: true),
                    MenuItemsId = table.Column<int>(type: "int", nullable: true)
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
                        name: "FK_MenuItemBranch_MenuItems_MenuItemsId",
                        column: x => x.MenuItemsId,
                        principalTable: "MenuItems",
                        principalColumn: "Id");
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
                name: "IX_MenuItemBranch_MenuItemsId",
                table: "MenuItemBranch",
                column: "MenuItemsId");

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
