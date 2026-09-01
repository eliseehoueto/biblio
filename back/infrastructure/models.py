"""SQLAlchemy models for persistence layer."""
from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID

from infrastructure.database import Base


class BookModel(Base):
    """SQLAlchemy model for Book entity."""
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=False)
    isbn = Column(String(20), unique=True, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="available")
    borrowed_by = Column(String(255), nullable=True)
    borrow_date = Column(DateTime, nullable=True)

    def to_domain(self):
        """Convert SQLAlchemy model to domain entity."""
        from domain.entities import Book, BookStatus
        return Book(
            id=self.id,
            title=self.title,
            author=self.author,
            isbn=self.isbn,
            status=BookStatus(self.status),
            borrowed_by=self.borrowed_by,
            borrow_date=self.borrow_date,
        )

    @staticmethod
    def from_domain(book):
        """Convert domain entity to SQLAlchemy model."""
        return BookModel(
            id=book.id,
            title=book.title,
            author=book.author,
            isbn=book.isbn,
            status=book.status.value,
            borrowed_by=book.borrowed_by,
            borrow_date=book.borrow_date,
        )
