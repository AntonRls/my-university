using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HacatonMax.Admin.Infrastructure.Migration
{
    /// <inheritdoc />
    public partial class Init_Admin : Microsoft.EntityFrameworkCore.Migrations.Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "admin");

            migrationBuilder.CreateTable(
                name: "students_in_universities",
                schema: "admin",
                columns: table => new
                {
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    university_id = table.Column<long>(type: "bigint", nullable: false),
                    university_name = table.Column<string>(type: "text", nullable: false),
                    approve_status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_students_in_universities", x => new { x.user_id, x.university_id });
                });

            migrationBuilder.CreateTable(
                name: "universities",
                schema: "admin",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    tenant_name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_universities", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_students_in_universities_user_id",
                schema: "admin",
                table: "students_in_universities",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "students_in_universities",
                schema: "admin");

            migrationBuilder.DropTable(
                name: "universities",
                schema: "admin");
        }
    }
}
