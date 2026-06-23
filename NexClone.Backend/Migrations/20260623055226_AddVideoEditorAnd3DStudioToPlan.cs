using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexClone.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddVideoEditorAnd3DStudioToPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ThreeDStudioCostPerExport",
                table: "Plans",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "ThreeDStudioEnabled",
                table: "Plans",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "VideoEditorCostPerExport",
                table: "Plans",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "VideoEditorEnabled",
                table: "Plans",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ThreeDStudioCostPerExport",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "ThreeDStudioEnabled",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "VideoEditorCostPerExport",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "VideoEditorEnabled",
                table: "Plans");
        }
    }
}
