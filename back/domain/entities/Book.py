"""Domain entities for the Library."""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4


class BookStatus(str, Enum):
    """Book availability status."""
    AVAILABLE = "available"
    BORROWED = "borrowed"


@dataclass
class Book:
    """Book entity representing a physical book in the library."""
    title: str
    author: str
    isbn: str
    status: BookStatus = BookStatus.AVAILABLE
    id: UUID = field(default_factory=uuid4)
    borrowed_by: str | None = None
    borrow_date: datetime | None = None
    archived_at: datetime | None = None


    def mark_as_borrowed(self, borrower_name: str) -> None:
        """Mark book as borrowed by a user."""
        if self.status == BookStatus.BORROWED:
            raise ValueError(f"Book '{self.title}' is already borrowed")
        self.status = BookStatus.BORROWED
        self.borrowed_by = borrower_name
        self.borrow_date = datetime.now()

    def mark_as_available(self) -> None:
        """Mark book as available (returned)."""
        self.status = BookStatus.AVAILABLE
        self.borrowed_by = None
        self.borrow_date = None

    def is_available(self) -> bool:
        """Check if book is available for borrowing."""
        return self.status == BookStatus.AVAILABLE

    def is_deleted(self) -> bool:
        """Check if book is archived."""
        return self.archived_at is not None

    def archive(self) -> None:
        """Archive the book without removing it from persistence."""
        self.archived_at = datetime.now()

    def restore(self) -> None:
        """Restore an archived book."""
        self.archived_at = None