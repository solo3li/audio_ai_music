using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexClone.Backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSttCostToPerMinute : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "SttCostPerMinute",
                table: "Plans",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "SttEnabled",
                table: "Plans",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "SttMaxFileSizeMb",
                table: "Plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "TtsCostPerChar",
                table: "Plans",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "TtsEnabled",
                table: "Plans",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "TtsMaxCharsPerRequest",
                table: "Plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SttCostPerMinute",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "SttEnabled",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "SttMaxFileSizeMb",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "TtsCostPerChar",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "TtsEnabled",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "TtsMaxCharsPerRequest",
                table: "Plans");
        }
    }
}
