using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HacatonMax.University.Schedule.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Init_Schedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "schedule");

            migrationBuilder.CreateTable(
                name: "entries",
                schema: "schedule",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tenant_id = table.Column<long>(type: "bigint", nullable: false),
                    group_id = table.Column<long>(type: "bigint", nullable: true),
                    owner_user_id = table.Column<long>(type: "bigint", nullable: true),
                    source_entity_id = table.Column<long>(type: "bigint", nullable: true),
                    source_type = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    description = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    teacher = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    physical_location = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    online_link = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ends_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    delivery_type = table.Column<string>(type: "text", nullable: false),
                    created_by_user_id = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_entries", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "attendees",
                schema: "schedule",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    schedule_entry_id = table.Column<long>(type: "bigint", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    added_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_attendees", x => x.id);
                    table.ForeignKey(
                        name: "FK_attendees_entries_schedule_entry_id",
                        column: x => x.schedule_entry_id,
                        principalSchema: "schedule",
                        principalTable: "entries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ux_schedule_attendees_entry_user",
                schema: "schedule",
                table: "attendees",
                columns: new[] { "schedule_entry_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_schedule_entries_group_window",
                schema: "schedule",
                table: "entries",
                columns: new[] { "tenant_id", "group_id", "starts_at" });

            migrationBuilder.CreateIndex(
                name: "ix_schedule_entries_owner_window",
                schema: "schedule",
                table: "entries",
                columns: new[] { "owner_user_id", "starts_at" });

            migrationBuilder.CreateIndex(
                name: "ix_schedule_entries_range",
                schema: "schedule",
                table: "entries",
                columns: new[] { "tenant_id", "starts_at" });

            migrationBuilder.CreateIndex(
                name: "ux_schedule_entries_source",
                schema: "schedule",
                table: "entries",
                columns: new[] { "tenant_id", "source_type", "source_entity_id" },
                unique: true,
                filter: "source_entity_id IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "attendees",
                schema: "schedule");

            migrationBuilder.DropTable(
                name: "entries",
                schema: "schedule");
        }
    }
}
