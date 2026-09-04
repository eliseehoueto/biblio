"""FastAPI application setup and configuration."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from interfaces.dependencies import (
    get_book_repository,
    get_create_book_use_case,
    get_list_books_use_case,
    get_list_archived_books_use_case,
    get_borrow_book_use_case,
    get_return_book_use_case,
    get_archive_book_use_case,
    get_destroy_book_use_case,
    get_restore_book_use_case,
)
from infrastructure.database import engine, Base, ensure_archive_column

from interfaces.routes import create_book_router


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="Library API",
        description="Hexagonal architecture library management system with PostgreSQL",
        version="1.0.0"
    )

    # CORS configuration - allow frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Create tables in database
    Base.metadata.create_all(bind=engine)
    ensure_archive_column()

   

    # Include routes (interfaces layer)
    app.include_router(
        create_book_router(
            get_create_book_use_case,
            get_list_books_use_case,
            get_list_archived_books_use_case,
            get_borrow_book_use_case,
            get_return_book_use_case,
            get_archive_book_use_case,
            get_destroy_book_use_case,
            get_restore_book_use_case,
        )
    )

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    return app

