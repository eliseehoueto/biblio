"""Port interfaces (contracts) for the library domain."""
from abc import ABC, abstractmethod
from uuid import UUID

from domain.entities.Book import Book


class BookRepository(ABC):
    """Port: Interface for book persistence."""

    @abstractmethod
    def save(self, book: Book) -> Book:
        """Save a book to the repository."""
        pass

    @abstractmethod
    def find_by_id(self, book_id: UUID) -> Book | None:
        """Find a book by its ID."""
        pass

    @abstractmethod
    def find_all(self) -> list[Book]:
        """Retrieve all books."""
        pass

    @abstractmethod
    def find_archived(self) -> list[Book]:
        """Retrieve archived books."""
        pass

    @abstractmethod
    def find_by_isbn(self, isbn: str) -> Book | None:
        """Find a book by its ISBN."""
        pass

    @abstractmethod
    def update(self, book: Book) -> Book:
        """Update an existing book."""
        pass

    @abstractmethod
    def delete(self, book_id: UUID) -> bool:
        """Delete a book by its ID."""
        pass

    @abstractmethod
    def archive(self, book_id: UUID) -> bool:
        """Archive a book by its ID."""
        pass

    @abstractmethod
    def restore(self, book_id: UUID) -> bool:
        """Restore an archived book by its ID."""
        pass