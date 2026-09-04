"""DTOs (Data Transfer Objects) for application layer."""
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class CreateBookRequest:
    """DTO for creating a book."""
    title: str
    author: str
    isbn: str


@dataclass
class BorrowBookRequest:
    """DTO for borrowing a book - only borrower_name is needed from request body."""
    borrower_name: str


@dataclass
class BorrowBookRequestInternal:
    """Internal DTO with book_id added from URL path."""
    book_id: UUID
    borrower_name: str


@dataclass
class BookDTO:
    """DTO for book response."""
    id: UUID
    title: str
    author: str
    isbn: str
    status: str
    borrowed_by: str | None
    borrow_date: str | None
    archived_at: datetime | None = None
