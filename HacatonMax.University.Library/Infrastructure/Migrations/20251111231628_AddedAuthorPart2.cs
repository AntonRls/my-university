using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HacatonMax.University.Library.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddedAuthorPart2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_user_favorite_books_book_id",
                schema: "university-library",
                table: "user_favorite_books",
                column: "book_id");

            migrationBuilder.AddForeignKey(
                name: "FK_user_favorite_books_books_book_id",
                schema: "university-library",
                table: "user_favorite_books",
                column: "book_id",
                principalSchema: "university-library",
                principalTable: "books",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_user_favorite_books_books_book_id",
                schema: "university-library",
                table: "user_favorite_books");

            migrationBuilder.DropIndex(
                name: "IX_user_favorite_books_book_id",
                schema: "university-library",
                table: "user_favorite_books");
        }
    }
}
