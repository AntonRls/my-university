using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HacatonMax.University.StudentsProject.Infrastructure.Migrations;

/// <inheritdoc />
public partial class AddProjectParticipants : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<long>(
            name: "creator_id",
            schema: "students-projects",
            table: "student_projects",
            type: "bigint",
            nullable: false,
            defaultValue: 0L);

        migrationBuilder.CreateTable(
            name: "team_roles",
            schema: "students-projects",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                name = table.Column<string>(type: "text", nullable: false),
                description = table.Column<string>(type: "text", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_team_roles", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "student_project_participants",
            schema: "students-projects",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                student_project_id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<long>(type: "bigint", nullable: false),
                status = table.Column<int>(type: "integer", nullable: false),
                is_creator = table.Column<bool>(type: "boolean", nullable: false),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_student_project_participants", x => x.id);
                table.ForeignKey(
                    name: "FK_student_project_participants_student_projects_student_project_id",
                    column: x => x.student_project_id,
                    principalSchema: "students-projects",
                    principalTable: "student_projects",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "student_project_participant_roles",
            schema: "students-projects",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                participant_id = table.Column<Guid>(type: "uuid", nullable: false),
                team_role_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_student_project_participant_roles", x => x.id);
                table.ForeignKey(
                    name: "FK_student_project_participant_roles_student_project_participants_participant_id",
                    column: x => x.participant_id,
                    principalSchema: "students-projects",
                    principalTable: "student_project_participants",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_student_project_participant_roles_team_roles_team_role_id",
                    column: x => x.team_role_id,
                    principalSchema: "students-projects",
                    principalTable: "team_roles",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_student_project_participant_roles_participant_id",
            schema: "students-projects",
            table: "student_project_participant_roles",
            column: "participant_id");

        migrationBuilder.CreateIndex(
            name: "IX_student_project_participant_roles_team_role_id",
            schema: "students-projects",
            table: "student_project_participant_roles",
            column: "team_role_id");

        migrationBuilder.CreateIndex(
            name: "IX_student_project_participants_student_project_id",
            schema: "students-projects",
            table: "student_project_participants",
            column: "student_project_id");

        migrationBuilder.CreateIndex(
            name: "IX_student_project_participants_student_project_id_user_id",
            schema: "students-projects",
            table: "student_project_participants",
            columns: new[] { "student_project_id", "user_id" },
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "student_project_participant_roles",
            schema: "students-projects");

        migrationBuilder.DropTable(
            name: "student_project_participants",
            schema: "students-projects");

        migrationBuilder.DropTable(
            name: "team_roles",
            schema: "students-projects");

        migrationBuilder.DropColumn(
            name: "creator_id",
            schema: "students-projects",
            table: "student_projects");
    }
}

