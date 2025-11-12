using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HacatonMax.University.Events.Infrastructure.Migrations;

/// <inheritdoc />
public partial class AddEventCreator : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<long>(
            name: "creator_id",
            schema: "university-events",
            table: "university_events",
            type: "bigint",
            nullable: false,
            defaultValue: 0L);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "creator_id",
            schema: "university-events",
            table: "university_events");
    }
}

