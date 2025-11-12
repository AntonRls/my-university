using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HacatonMax.University.StudentsProject.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentProjectEventLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "event_id",
                schema: "students-projects",
                table: "student_projects",
                type: "bigint",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "event_id",
                schema: "students-projects",
                table: "student_projects");
        }
    }
}

