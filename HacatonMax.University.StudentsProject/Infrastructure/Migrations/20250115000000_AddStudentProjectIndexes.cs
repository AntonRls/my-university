using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HacatonMax.University.StudentsProject.Infrastructure.Migrations;

/// <inheritdoc />
public partial class AddStudentProjectIndexes : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateIndex(
            name: "IX_student_projects_event_id",
            schema: "students-projects",
            table: "student_projects",
            column: "event_id");

        migrationBuilder.CreateIndex(
            name: "IX_student_project_participants_student_project_id_created_at",
            schema: "students-projects",
            table: "student_project_participants",
            columns: new[] { "student_project_id", "created_at" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_student_projects_event_id",
            schema: "students-projects",
            table: "student_projects");

        migrationBuilder.DropIndex(
            name: "IX_student_project_participants_student_project_id_created_at",
            schema: "students-projects",
            table: "student_project_participants");
    }
}

