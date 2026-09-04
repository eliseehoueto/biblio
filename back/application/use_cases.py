"""Use cases for library operations."""
from uuid import UUID

from application.dtos import BookDTO, BorrowBookRequestInternal, CreateBookRequest
from domain.entities.Book import Book
from domain.ports import BookRepository


class CreateBookUseCase:
    """Use case: Create a new book."""

    def __init__(self, book_repository: BookRepository):
        self.book_repository = book_repository

    def execute(self, request: CreateBookRequest) -> BookDTO:
        """
        Create a new book in the library.

        Args:
            request: CreateBookRequest with title, author, isbn
            
        Returns:
            BookDTO with created book details
            
        Raises:
            ValueError: If a book with the same ISBN already exists
        """
        # Check if book already exists
        existing = self.book_repository.find_by_isbn(request.isbn)
        if existing:
            raise ValueError(f"A book with ISBN {request.isbn} already exists")

        # Create new book
        new_book = Book(
            title=request.title,
            author=request.author,
            isbn=request.isbn
        )

        # Save and return
        saved_book = self.book_repository.save(new_book)
        return self._to_dto(saved_book)

    @staticmethod
    def _to_dto(book: Book) -> BookDTO:
        return BookDTO(
            id=book.id,
            title=book.title,
            author=book.author,
            isbn=book.isbn,
            status=book.status.value,
            borrowed_by=book.borrowed_by,
            borrow_date=book.borrow_date.isoformat() if book.borrow_date else None,
            archived_at=book.archived_at,
        )


class ListBooksUseCase:
    """Use case: List all books with their statuses."""

    def __init__(self, book_repository: BookRepository):
        self.book_repository = book_repository

    def execute(self) -> list[BookDTO]:
        """
        Get all books in the library with their current status.

        Returns:
            List of BookDTO objects
        """
        books = self.book_repository.find_all()
        return [self._to_dto(book) for book in books]

    @staticmethod
    def _to_dto(book: Book) -> BookDTO:
        return BookDTO(
            id=book.id,
            title=book.title,
            author=book.author,
            isbn=book.isbn,
            status=book.status.value,
            borrowed_by=book.borrowed_by,
            borrow_date=book.borrow_date.isoformat() if book.borrow_date else None,
            archived_at=book.archived_at,
        )


class ListArchivedBooksUseCase:
    """Use case: list archived books for administration."""

    def __init__(self, book_repository: BookRepository):
        self.book_repository = book_repository

    def execute(self) -> list[BookDTO]:
        return [
            ListBooksUseCase._to_dto(book)
            for book in self.book_repository.find_archived()
        ]


class BorrowBookUseCase:
    """Use case: Borrow a book from the library."""

    def __init__(self, book_repository: BookRepository):
        self.book_repository = book_repository

    def execute(self, request: BorrowBookRequestInternal) -> BookDTO:
        """
        Borrow a book from the library.
        
        Args:
            request: BorrowBookRequestInternal with book_id and borrower_name

        Returns:
            BookDTO with updated book status
            
        Raises:
            ValueError: If book not found or already borrowed
        """
        # Find book
        book = self.book_repository.find_by_id(request.book_id)
        if not book:
            raise ValueError(f"Book with ID {request.book_id} not found")

        # Check availability
        if not book.is_available():
            raise ValueError(
                f"Book '{book.title}' is not available "
                f"(borrowed by {book.borrowed_by})"
            )

        # Mark as borrowed
        book.mark_as_borrowed(request.borrower_name)

        # Update and return
        updated_book = self.book_repository.update(book)
        return self._to_dto(updated_book)

    @staticmethod
    def _to_dto(book: Book) -> BookDTO:
        return BookDTO(
            id=book.id,
            title=book.title,
            author=book.author,
            isbn=book.isbn,
            status=book.status.value,
            borrowed_by=book.borrowed_by,
            borrow_date=book.borrow_date.isoformat() if book.borrow_date else None,
            archived_at=book.archived_at,
        )


class ReturnBookUseCase:
    """Use case: Return a borrowed book to the library."""

    def __init__(self, book_repository: BookRepository):
        self.book_repository = book_repository

    def execute(self, book_id: UUID) -> BookDTO:
        """
        Return a borrowed book.
        
        Args:
            book_id: UUID of the book to return
            
        Returns:
            BookDTO with updated book status
            
        Raises:
            ValueError: If book not found or not borrowed
        """
        book = self.book_repository.find_by_id(book_id)
        if not book:
            raise ValueError(f"Book with ID {book_id} not found")

        if book.is_available():
            raise ValueError(f"Book '{book.title}' is not currently borrowed")

        book.mark_as_available()
        updated_book = self.book_repository.update(book)
        return self._to_dto(updated_book)

    @staticmethod
    def _to_dto(book: Book) -> BookDTO:
        return BookDTO(
            id=book.id,
            title=book.title,
            author=book.author,
            isbn=book.isbn,
            status=book.status.value,
            borrowed_by=book.borrowed_by,
            borrow_date=book.borrow_date.isoformat() if book.borrow_date else None,
            archived_at=book.archived_at,
        )


class ArchiveBookUseCase:
    """Use case: Archive a book from the library."""

    def __init__(self, book_repository: BookRepository):
        self.book_repository = book_repository

    def execute(self, book_id: UUID) -> bool:
        """
        Archive a book by ID.

        Args:
            book_id: UUID of the book to archive

        Returns:
            True if archived

        Raises:
            ValueError: If book not found
        """
        success = self.book_repository.archive(book_id)
        if not success:
            raise ValueError(f"Book with ID {book_id} not found")
        return True


class DestroyBookUseCase:
    """Use case: Permanently destroy a book from the library."""

    def __init__(self, book_repository:BookRepository):
        self.book_repository= book_repository


    def execute(self,book_id:UUID) -> bool:

        """
        Permanently destroy a book by ID.
        
        Args:
            book_id: UUID of the book to destroy
            
        Returns:
            True if destroyed
            
        Raises:
            ValueError: If book not found
        """
        success = self.book_repository.delete(book_id)
        if not success:
            raise ValueError(f"Book with ID {book_id} not found")
        return True


class RestoreBookUseCase:
    """Use case: restore an archived book."""

    def __init__(self, book_repository: BookRepository):
        self.book_repository = book_repository

    def execute(self, book_id: UUID) -> bool:
        if not self.book_repository.restore(book_id):
            raise ValueError(f"Archived book with ID {book_id} not found")
        return True