"""Adapter implementations of BookRepository."""
from uuid import UUID
from sqlalchemy.orm import Session

from domain.entities import Book
from domain.ports import BookRepository
from infrastructure.models import BookModel


class InMemoryBookRepository(BookRepository):
    """Adapter: In-memory implementation of BookRepository (for testing)."""

    def __init__(self):
        self._books: dict[UUID, Book] = {}

    def save(self, book: Book) -> Book:
        """Save a book to memory."""
        self._books[book.id] = book
        return book

    def find_by_id(self, book_id: UUID) -> Book | None:
        """Find a book by ID."""
        return self._books.get(book_id)

    def find_all(self) -> list[Book]:
        """Get all books."""
        return list(self._books.values())

    def find_by_isbn(self, isbn: str) -> Book | None:
        """Find a book by ISBN."""
        for book in self._books.values():
            if book.isbn == isbn:
                return book
        return None

    def update(self, book: Book) -> Book:
        """Update an existing book."""
        if book.id not in self._books:
            raise ValueError(f"Book with ID {book.id} not found")
        self._books[book.id] = book
        return book

    def delete(self, book_id: UUID) -> bool:
        """Delete a book."""
        if book_id in self._books:
            del self._books[book_id]
            return True
        return False


class PostgreSQLBookRepository(BookRepository):
    """Adapter: PostgreSQL implementation of BookRepository."""

    def __init__(self, db: Session):
        self.db = db

    def save(self, book: Book) -> Book:
        """Save a new book to the database."""
        db_book = BookModel.from_domain(book)
        self.db.add(db_book)
        self.db.commit()
        self.db.refresh(db_book)
        return db_book.to_domain()

    def find_by_id(self, book_id: UUID) -> Book | None:
        """Find a book by ID."""
        db_book = self.db.query(BookModel).filter(
            BookModel.id == book_id
        ).first()
        if db_book:
            return db_book.to_domain()
        return None

    def find_all(self) -> list[Book]:
        """Get all books."""
        db_books = self.db.query(BookModel).all()
        return [db_book.to_domain() for db_book in db_books]

    def find_by_isbn(self, isbn: str) -> Book | None:
        """Find a book by ISBN."""
        db_book = self.db.query(BookModel).filter(
            BookModel.isbn == isbn
        ).first()
        if db_book:
            return db_book.to_domain()
        return None

    def update(self, book: Book) -> Book:
        """Update an existing book."""
        db_book = self.db.query(BookModel).filter(
            BookModel.id == book.id
        ).first()
        
        if not db_book:
            raise ValueError(f"Book with ID {book.id} not found")
        
        # Update fields
        db_book.title = book.title
        db_book.author = book.author
        db_book.isbn = book.isbn
        db_book.status = book.status.value
        db_book.borrowed_by = book.borrowed_by
        db_book.borrow_date = book.borrow_date
        
        self.db.commit()
        self.db.refresh(db_book)
        return db_book.to_domain()

    def delete(self, book_id: UUID) -> bool:
        """Delete a book."""
        db_book = self.db.query(BookModel).filter(
            BookModel.id == book_id
        ).first()
        
        if db_book:
            self.db.delete(db_book)
            self.db.commit()
            return True
        return False

