using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HacatonMax.University.Events.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEventLocationAndRegistrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "location",
                schema: "university-events",
                table: "university_events",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "university_event_registrations",
                schema: "university-events",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    university_event_id = table.Column<long>(type: "bigint", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_university_event_registrations", x => x.id);
                    table.ForeignKey(
                        name: "FK_university_event_registrations_university_events_university~",
                        column: x => x.university_event_id,
                        principalSchema: "university-events",
                        principalTable: "university_events",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_university_event_registrations_university_event_id_user_id",
                schema: "university-events",
                table: "university_event_registrations",
                columns: new[] { "university_event_id", "user_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "university_event_registrations",
                schema: "university-events");

            migrationBuilder.DropColumn(
                name: "location",
                schema: "university-events",
                table: "university_events");
        }
    }
}
