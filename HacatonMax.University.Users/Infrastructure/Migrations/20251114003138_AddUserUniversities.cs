using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HacatonMax.University.Users.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserUniversities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_universities",
                schema: "users",
                columns: table => new
                {
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    university_id = table.Column<long>(type: "bigint", nullable: false),
                    joined_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_universities", x => new { x.user_id, x.university_id });
                    table.ForeignKey(
                        name: "FK_user_universities_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "users",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_universities_university_id",
                schema: "users",
                table: "user_universities",
                column: "university_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_universities_user_id",
                schema: "users",
                table: "user_universities",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_universities",
                schema: "users");
        }
    }
}
