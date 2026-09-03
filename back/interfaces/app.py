"""FastAPI application setup and configuration."""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from infrastructure.models import BookModel

from interfaces.dependencies import (
    get_book_repository,
    get_create_book_use_case,
    get_list_books_use_case,
    get_borrow_book_use_case,
    get_return_book_use_case,
    get_delete_book_use_case
)
from infrastructure.database import engine, Base, get_db

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

   

    # Include routes (interfaces layer)
    app.include_router(
        create_book_router(
            get_create_book_use_case,
            get_list_books_use_case,
            get_borrow_book_use_case,
            get_return_book_use_case,
            get_delete_book_use_case
        )
    )

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    return app

