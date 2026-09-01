"""
Library Management System - Hexagonal Architecture

This project implements a clean architecture with strict separation of concerns:

Domain Layer (domain/)
  - entities.py: Book entity and BookStatus enum
  - ports.py: BookRepository interface (abstraction for persistence)

Application Layer (application/)
  - dtos.py: Data Transfer Objects for API communication
  - use_cases.py: Business logic for the 3 operations:
    1. CreateBookUseCase
    2. ListBooksUseCase
    3. BorrowBookUseCase

Infrastructure Layer (infrastructure/)
  - repositories.py: Concrete implementation (InMemoryBookRepository)

Interfaces Layer (interfaces/)
  - app.py: FastAPI application factory
  - routes.py: API endpoints with dependency injection

Main entry: main.py
"""
