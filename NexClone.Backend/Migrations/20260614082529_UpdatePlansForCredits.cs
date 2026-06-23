using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexClone.Backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePlansForCredits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxImagesGenerated",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "MaxSttMinutes",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "MaxTtsCharacters",
                table: "Plans");

            migrationBuilder.AddColumn<string>(
                name: "AllowedTools",
                table: "Plans",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyCredits",
                table: "Plans",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CreditsUsed",
                table: "GenerationHistories",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "AvailableCredits",
                table: "AspNetUsers",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowedTools",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "MonthlyCredits",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "CreditsUsed",
                table: "GenerationHistories");

            migrationBuilder.DropColumn(
                name: "AvailableCredits",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<int>(
                name: "MaxImagesGenerated",
                table: "Plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxSttMinutes",
                table: "Plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxTtsCharacters",
                table: "Plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
