from application.use_cases import (
    BorrowBookUseCase,
    CreateBookUseCase,
    ListBooksUseCase,
    ListArchivedBooksUseCase,
    ReturnBookUseCase,
    ArchiveBookUseCase,
    DestroyBookUseCase,
    RestoreBookUseCase,
)

from infrastructure.models import BookModel
from infrastructure.repositories import PostgreSQLBookRepository
from infrastructure.database import get_db
from fastapi import Depends


from sqlalchemy.orm import Session


 # Dependency injection for repositories and use cases
def get_book_repository(db: Session = Depends(get_db)):
    return PostgreSQLBookRepository(db)

def get_create_book_use_case(
    repo: PostgreSQLBookRepository = Depends(get_book_repository)
):
    return CreateBookUseCase(repo)

def get_list_books_use_case(
    repo: PostgreSQLBookRepository = Depends(get_book_repository)
):
    return ListBooksUseCase(repo)

def get_list_archived_books_use_case(
    repo: PostgreSQLBookRepository = Depends(get_book_repository)
):
    return ListArchivedBooksUseCase(repo)

def get_borrow_book_use_case(
    repo: PostgreSQLBookRepository = Depends(get_book_repository)
):
    return BorrowBookUseCase(repo)

def get_return_book_use_case(
    repo: PostgreSQLBookRepository = Depends(get_book_repository)
):
    return ReturnBookUseCase(repo)

def get_archive_book_use_case(
    repo: PostgreSQLBookRepository = Depends(get_book_repository)
):
    return ArchiveBookUseCase(repo)

def get_destroy_book_use_case(
    repo: PostgreSQLBookRepository = Depends(get_book_repository)
):
    return DestroyBookUseCase(repo)

def get_restore_book_use_case(
    repo: PostgreSQLBookRepository = Depends(get_book_repository)
):
    return RestoreBookUseCase(repo)