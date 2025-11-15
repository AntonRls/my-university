using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HacatonMax.University.Deadlines.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Init_Deadlines : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "deadlines");

            migrationBuilder.CreateTable(
                name: "deadlines",
                schema: "deadlines",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tenant_id = table.Column<long>(type: "bigint", nullable: false),
                    group_id = table.Column<long>(type: "bigint", nullable: false),
                    title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    description_html = table.Column<string>(type: "text", nullable: false),
                    due_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    schedule_entry_id = table.Column<long>(type: "bigint", nullable: true),
                    creator_user_id = table.Column<long>(type: "bigint", nullable: false),
                    last_editor_user_id = table.Column<long>(type: "bigint", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    access_scope = table.Column<string>(type: "text", nullable: false),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    last_notification_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deadlines", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "deadline_completions",
                schema: "deadlines",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    deadline_id = table.Column<long>(type: "bigint", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    tenant_id = table.Column<long>(type: "bigint", nullable: false),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deadline_completions", x => x.id);
                    table.ForeignKey(
                        name: "FK_deadline_completions_deadlines_deadline_id",
                        column: x => x.deadline_id,
                        principalSchema: "deadlines",
                        principalTable: "deadlines",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "deadline_reminders",
                schema: "deadlines",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    deadline_id = table.Column<long>(type: "bigint", nullable: false),
                    offset = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    sent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deadline_reminders", x => x.id);
                    table.ForeignKey(
                        name: "FK_deadline_reminders_deadlines_deadline_id",
                        column: x => x.deadline_id,
                        principalSchema: "deadlines",
                        principalTable: "deadlines",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_deadline_completions_deadline_id_user_id",
                schema: "deadlines",
                table: "deadline_completions",
                columns: new[] { "deadline_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_deadline_completions_tenant_id_user_id",
                schema: "deadlines",
                table: "deadline_completions",
                columns: new[] { "tenant_id", "user_id" });

            migrationBuilder.CreateIndex(
                name: "IX_deadline_reminders_deadline_id_offset",
                schema: "deadlines",
                table: "deadline_reminders",
                columns: new[] { "deadline_id", "offset" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_deadlines_schedule_entry_id",
                schema: "deadlines",
                table: "deadlines",
                column: "schedule_entry_id",
                filter: "schedule_entry_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_deadlines_tenant_id_group_id",
                schema: "deadlines",
                table: "deadlines",
                columns: new[] { "tenant_id", "group_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "deadline_completions",
                schema: "deadlines");

            migrationBuilder.DropTable(
                name: "deadline_reminders",
                schema: "deadlines");

            migrationBuilder.DropTable(
                name: "deadlines",
                schema: "deadlines");
        }
    }
}
