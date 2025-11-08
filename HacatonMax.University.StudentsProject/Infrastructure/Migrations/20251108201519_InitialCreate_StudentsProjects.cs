using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HacatonMax.University.StudentsProject.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate_StudentsProjects : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "students-projects");

            migrationBuilder.CreateTable(
                name: "skills",
                schema: "students-projects",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_skills", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "student_projects",
                schema: "students-projects",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_projects", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "skill_student_projects",
                schema: "students-projects",
                columns: table => new
                {
                    SkillId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentProjectId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_skill_student_projects", x => new { x.SkillId, x.StudentProjectId });
                    table.ForeignKey(
                        name: "FK_skill_student_projects_skills_SkillId",
                        column: x => x.SkillId,
                        principalSchema: "students-projects",
                        principalTable: "skills",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_skill_student_projects_student_projects_StudentProjectId",
                        column: x => x.StudentProjectId,
                        principalSchema: "students-projects",
                        principalTable: "student_projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_skill_student_projects_StudentProjectId",
                schema: "students-projects",
                table: "skill_student_projects",
                column: "StudentProjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "skill_student_projects",
                schema: "students-projects");

            migrationBuilder.DropTable(
                name: "skills",
                schema: "students-projects");

            migrationBuilder.DropTable(
                name: "student_projects",
                schema: "students-projects");
        }
    }
}
