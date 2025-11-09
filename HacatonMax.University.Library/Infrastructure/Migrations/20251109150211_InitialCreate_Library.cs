using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HacatonMax.University.Library.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate_Library : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "university-library");

            migrationBuilder.CreateTable(
                name: "books",
                schema: "university-library",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    count = table.Column<long>(type: "bigint", nullable: false),
                    take_count = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_books", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tags",
                schema: "university-library",
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
                name: "user_favorite_books",
                schema: "university-library",
                columns: table => new
                {
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    book_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_favorite_books", x => new { x.user_id, x.book_id });
                });

            migrationBuilder.CreateTable(
                name: "reservation_books",
                schema: "university-library",
                columns: table => new
                {
                    book_id = table.Column<long>(type: "bigint", nullable: false),
                    reservation_owner_id = table.Column<long>(type: "bigint", nullable: false),
                    end_reservation_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    count_extend_reservation = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reservation_books", x => new { x.reservation_owner_id, x.book_id });
                    table.ForeignKey(
                        name: "FK_reservation_books_books_book_id",
                        column: x => x.book_id,
                        principalSchema: "university-library",
                        principalTable: "books",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "university_books_tags",
                schema: "university-library",
                columns: table => new
                {
                    university_book_id = table.Column<long>(type: "bigint", nullable: false),
                    tag_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_university_books_tags", x => new { x.university_book_id, x.tag_id });
                    table.ForeignKey(
                        name: "FK_university_books_tags_books_university_book_id",
                        column: x => x.university_book_id,
                        principalSchema: "university-library",
                        principalTable: "books",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_university_books_tags_tags_tag_id",
                        column: x => x.tag_id,
                        principalSchema: "university-library",
                        principalTable: "tags",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_reservation_books_book_id",
                schema: "university-library",
                table: "reservation_books",
                column: "book_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_university_books_tags_tag_id",
                schema: "university-library",
                table: "university_books_tags",
                column: "tag_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_favorite_books_user_id",
                schema: "university-library",
                table: "user_favorite_books",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reservation_books",
                schema: "university-library");

            migrationBuilder.DropTable(
                name: "university_books_tags",
                schema: "university-library");

            migrationBuilder.DropTable(
                name: "user_favorite_books",
                schema: "university-library");

            migrationBuilder.DropTable(
                name: "books",
                schema: "university-library");

            migrationBuilder.DropTable(
                name: "tags",
                schema: "university-library");
        }
    }
}
