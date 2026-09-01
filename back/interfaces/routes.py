"""API routes for library operations."""
from uuid import UUID
from typing import Callable

from fastapi import APIRouter, HTTPException, status, Depends

from application.dtos import BookDTO, BorrowBookRequest, BorrowBookRequestInternal, CreateBookRequest
from application.use_cases import (
    BorrowBookUseCase,
    CreateBookUseCase,
    ListBooksUseCase,
    ReturnBookUseCase,
    DeleteBookUseCase,
)


def create_book_router(
    get_create_book_use_case: Callable[..., CreateBookUseCase],
    get_list_books_use_case: Callable[..., ListBooksUseCase],
    get_borrow_book_use_case: Callable[..., BorrowBookUseCase],
    get_return_book_use_case: Callable[..., ReturnBookUseCase],
    get_delete_book_use_case: Callable[..., DeleteBookUseCase],
) -> APIRouter:
    """
    Create router with book endpoints.
    Use cases are injected as dependencies.
    """
    router = APIRouter(prefix="/api/books", tags=["books"])

    @router.post(
        "",
        response_model=BookDTO,
        status_code=status.HTTP_201_CREATED,
        summary="Create a new book"
    )
    def create_book(
        request: CreateBookRequest,
        use_case: CreateBookUseCase = Depends(get_create_book_use_case),
    ) -> BookDTO:
        """
        Create a new book in the library.
        
        **Operation 1: Créer un livre**
        """
        try:
            return use_case.execute(request)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @router.get(
        "",
        response_model=list[BookDTO],
        summary="List all books"
    )
    def list_books(
        use_case: ListBooksUseCase = Depends(get_list_books_use_case),
    ) -> list[BookDTO]:
        """
        Get all books in the library with their current status.
        
        **Operation 2: Afficher les livres avec leurs statuts**
        """
        return use_case.execute()

    @router.post(
        "/{book_id}/borrow",
        response_model=BookDTO,
        summary="Borrow a book"
    )
    def borrow_book(
        book_id: UUID,
        request: BorrowBookRequest,
        use_case: BorrowBookUseCase = Depends(get_borrow_book_use_case),
    ) -> BookDTO:
        """
        Borrow a book from the library.
        
        **Operation 3: Emprunter un livre**
        
        Args:
            book_id: UUID of the book to borrow (in URL path)
            request: Contains borrower_name (in request body)
        """
        # Create internal request with book_id from path
        internal_request = BorrowBookRequestInternal(
            book_id=book_id,
            borrower_name=request.borrower_name
        )

        try:
            return use_case.execute(internal_request)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @router.post(
        "/{book_id}/return",
        response_model=BookDTO,
        summary="Return a book"
    )
    def return_book(
        book_id: UUID,
        use_case: ReturnBookUseCase = Depends(get_return_book_use_case),
    ) -> BookDTO:
        """
        Return a previously borrowed book to the library.
        """
        try:
            return use_case.execute(book_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @router.delete(
        "/{book_id}",
        status_code=status.HTTP_204_NO_CONTENT,
        summary="Delete a book"
    )
    def delete_book(
        book_id: UUID,
        use_case: DeleteBookUseCase = Depends(get_delete_book_use_case),
    ) -> None:
        """
        Delete a book from the library.
        """
        try:
            use_case.execute(book_id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )

    return router
