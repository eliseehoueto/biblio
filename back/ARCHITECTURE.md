# Architecture Hexagonale - Backend FastAPI

## Vue d'ensemble

Cette implémentation suit strictement les principes de l'architecture hexagonale :

- **Domain** : Entités et règles métier pures, indépendantes des frameworks
- **Application** : Orchestration des use cases, conversion DTO
- **Infrastructure** : Implémentation concrète (repositories, adaptateurs)
- **Interfaces** : Points d'entrée (API HTTP FastAPI)

## Structure Détaillée

### domain/entities.py
```python
# Entité métier pure
class Book:
    - title: str
    - author: str
    - isbn: str
    - status: BookStatus (AVAILABLE | BORROWED)
    - borrowed_by: str | None
    - borrow_date: datetime | None
    
    Méthodes métier:
    - mark_as_borrowed(borrower_name: str)
    - mark_as_available()
    - is_available() -> bool
```

### domain/ports.py
```python
# Contrats (interfaces) - dépendances inversées
abstract class BookRepository:
    - save(book: Book) -> Book
    - find_by_id(id: UUID) -> Book | None
    - find_all() -> list[Book]
    - find_by_isbn(isbn: str) -> Book | None
    - update(book: Book) -> Book
    - delete(id: UUID) -> bool
```

### application/dtos.py
```python
# Data Transfer Objects - communication avec l'extérieur
class CreateBookRequest:
    - title, author, isbn

class BorrowBookRequest:
    - borrower_name

class BookDTO:
    - id, title, author, isbn
    - status, borrowed_by, borrow_date
```

### application/use_cases.py
```python
# Orchestration des trois opérations

class CreateBookUseCase:
    __init__(repository: BookRepository)
    execute(request: CreateBookRequest) -> BookDTO
    
    # Logique:
    # 1. Vérifier ISBN unique (via repository)
    # 2. Créer entité Book
    # 3. Sauvegarder (repository.save)
    # 4. Retourner DTO

class ListBooksUseCase:
    __init__(repository: BookRepository)
    execute() -> list[BookDTO]
    
    # Logique:
    # 1. Récupérer tous les livres
    # 2. Convertir en DTOs
    # 3. Retourner

class BorrowBookUseCase:
    __init__(repository: BookRepository)
    execute(request: BorrowBookRequestInternal) -> BookDTO
    
    # Logique:
    # 1. Chercher le livre
    # 2. Vérifier disponibilité
    # 3. Marquer comme emprunté (règles métier du domain)
    # 4. Persister (repository.update)
    # 5. Retourner DTO
```

### infrastructure/repositories.py
```python
# Implémentation concrète du contrat
class InMemoryBookRepository(BookRepository):
    def __init__(self):
        self._books: dict[UUID, Book] = {}
    
    def save(book: Book) -> Book:
        self._books[book.id] = book
        return book
    
    # ... autres méthodes du contrat
    
# Peut être remplacé par:
# - PostgreSQLRepository
# - MongoDBRepository
# - Sans toucher à domain ou application
```

### interfaces/app.py
```python
# Factory FastAPI - injection de dépendances
def create_app() -> FastAPI:
    # Initialiser la couche infrastructure
    book_repository = InMemoryBookRepository()
    
    # Initialiser les use cases avec injection
    create_book_uc = CreateBookUseCase(book_repository)
    list_books_uc = ListBooksUseCase(book_repository)
    borrow_book_uc = BorrowBookUseCase(book_repository)
    
    # Inclure les routes
    app.include_router(
        create_book_router(create_book_uc, list_books_uc, borrow_book_uc)
    )
    
    return app
```

### interfaces/routes.py
```python
# Endpoints HTTP - conversion HTTP ↔ DTO
def create_book_router(...):
    router = APIRouter(prefix="/api/books")
    
    @router.post("")
    async def create_book(request: CreateBookRequest) -> BookDTO:
        # Appeler use case
        return create_book_use_case.execute(request)
    
    @router.get("")
    async def list_books() -> list[BookDTO]:
        # Appeler use case
        return list_books_use_case.execute()
    
    @router.post("/{book_id}/borrow")
    async def borrow_book(book_id: UUID, request: BorrowBookRequest) -> BookDTO:
        # Créer internal request avec ID
        internal_request = BorrowBookRequestInternal(
            book_id=book_id,
            borrower_name=request.borrower_name
        )
        # Appeler use case
        return borrow_book_use_case.execute(internal_request)
    
    return router
```

## Flux des Dépendances (Inversion of Control)

```
Interfaces (Routes)
        ↓ (dépend de)
Application (Use Cases)
        ↓ (dépend de)
Domain (Entities + Ports)
        ← (implements) Infrastructure (Repositories)

Domain n'a ZÉRO dépendance externe ✓
```

## Avantages cette architecture

### ✅ Testabilité
```python
# Facile à tester - créer un fake repository
class FakeBookRepository(BookRepository):
    def find_by_id(self, id):
        return Book(title="Test")

# Tester le use case avec le fake
use_case = CreateBookUseCase(FakeBookRepository())
result = use_case.execute(CreateBookRequest(...))
assert result.title == "Test"
```

### ✅ Changement de Repository sans refactoring
```python
# Remplacer in-memory par PostgreSQL
app.py:
    # Avant:
    repository = InMemoryBookRepository()
    
    # Après (2 lignes):
    repository = PostgreSQLBookRepository(connection_string)
    
# Zero changes needed in domain, application, interfaces
```

### ✅ Règles métier dans le Domain
```python
# Les règles métier vivent dans l'entité
class Book:
    def mark_as_borrowed(self, borrower_name: str):
        if self.status == BookStatus.BORROWED:
            raise ValueError("Already borrowed")  # ← Règle métier
        self.status = BookStatus.BORROWED
        self.borrowed_by = borrower_name
        self.borrow_date = datetime.now()

# Testable indépendamment
book = Book(title="1984", status=BookStatus.BORROWED, borrowed_by="Alice")
with pytest.raises(ValueError):
    book.mark_as_borrowed("Bob")  # ✓ Règle métier appliquée
```

## Migration vers une vraie BDD

Étapes pour migrer vers PostgreSQL:

1. Créer `infrastructure/postgresql_repository.py`:
```python
class PostgreSQLBookRepository(BookRepository):
    def __init__(self, db_connection):
        self.db = db_connection
    
    def save(self, book: Book) -> Book:
        # Exécuter INSERT SQL
        # Retourner book avec ID généré
        pass
```

2. Changer `interfaces/app.py`:
```python
# repository = InMemoryBookRepository()
repository = PostgreSQLBookRepository(get_db_connection())
```

3. Zero changes needed in:
   - Domain ✓
   - Application ✓
   - Routes ✓

