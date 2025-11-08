using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HacatonMax.University.Events.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate_Events : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "university-events");

            migrationBuilder.CreateTable(
                name: "tags",
                schema: "university-events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tags", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "university_events",
                schema: "university-events",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    start_datetime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    end_datetime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ParticipantsLimit = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_university_events", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "university_events_tags",
                schema: "university-events",
                columns: table => new
                {
                    university_event_id = table.Column<long>(type: "bigint", nullable: false),
                    tag_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_university_events_tags", x => new { x.university_event_id, x.tag_id });
                    table.ForeignKey(
                        name: "FK_university_events_tags_tags_tag_id",
                        column: x => x.tag_id,
                        principalSchema: "university-events",
                        principalTable: "tags",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_university_events_tags_university_events_university_event_id",
                        column: x => x.university_event_id,
                        principalSchema: "university-events",
                        principalTable: "university_events",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_university_events_tags_tag_id",
                schema: "university-events",
                table: "university_events_tags",
                column: "tag_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "university_events_tags",
                schema: "university-events");

            migrationBuilder.DropTable(
                name: "tags",
                schema: "university-events");

            migrationBuilder.DropTable(
                name: "university_events",
                schema: "university-events");
        }
    }
}
