using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace NexClone.Backend.Migrations
{
    /// <inheritdoc />
    public partial class ConvertPlanJsonToColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowedTools",
                table: "Plans");
        }
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeviceFingerprints");

            migrationBuilder.DropTable(
                name: "ToolConfigurations");

            migrationBuilder.DropColumn(
                name: "IsFreeTrial",
                table: "Plans");

            migrationBuilder.DropColumn(
                name: "SttCostPer100Kb",
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

            migrationBuilder.DropColumn(
                name: "InputText",
                table: "GenerationHistories");

            migrationBuilder.AddColumn<string>(
                name: "AllowedTools",
                table: "Plans",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
