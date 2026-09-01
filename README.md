# Architecture Hexagonale - Bibliothèque

## Vue d'ensemble

Projet complet de gestion de bibliothèque avec **architecture hexagonale stricte** implémentée en Python FastAPI pour le back-end et Next.js/TypeScript pour le front-end.

### Les 3 Opérations Principales

1. **➕ Créer un livre** - Ajouter un nouveau livre à la bibliothèque
2. **📖 Afficher les livres avec leurs statuts** - Lister tous les livres (disponible/emprunté)
3. **🎫 Emprunter un livre** - Marquer un livre comme emprunté par un utilisateur

---

## Architecture Backend (FastAPI)

### Couches Hexagonales

```
┌─────────────────────────────────────────┐
│       Interfaces (FastAPI Routes)       │  <- API HTTP
├─────────────────────────────────────────┤
│     Application (Use Cases)             │  <- Orchestration
├─────────────────────────────────────────┤
│   Domain (Entités + Règles métier)      │  <- Logique pure
├─────────────────────────────────────────┤
│  Infrastructure (Repositories)          │  <- Persistence
└─────────────────────────────────────────┘
```

### Structure des Fichiers

```
back/
├── domain/
│   ├── entities.py          # Entité Book, BookStatus
│   └── ports.py             # Interface BookRepository (contrat)
├── application/
│   ├── dtos.py              # CreateBookRequest, BookDTO, etc.
│   └── use_cases.py         # CreateBookUseCase, ListBooksUseCase, BorrowBookUseCase
├── infrastructure/
│   └── repositories.py      # InMemoryBookRepository (implémentation)
├── interfaces/
│   ├── app.py               # Factory FastAPI
│   └── routes.py            # Endpoints /api/books
├── main.py                  # Point d'entrée
└── requirements.txt         # Dépendances Python
```

### Principes Appliqués

✅ **Séparation des concerns** - Chaque couche a une responsabilité unique
✅ **Dépendance inversée** - Domain dépend de personne, interfaces dépendent de application/domain
✅ **Testabilité** - Use cases injectables, repository mockable
✅ **Extensibilité** - Repository in-memory peut être remplacé par PostgreSQL/MongoDB

---

## Architecture Frontend (Next.js 15+)

### Structure

```
front/biblio/
├── app/
│   ├── page.tsx             # Interface utilisateur principale
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   └── api.ts               # Client API (services)
├── package.json
└── tsconfig.json
```

### Composants

- **`lib/api.ts`** - Service qui appelle l'API backend
  - `createBook()` - Opération 1
  - `listBooks()` - Opération 2
  - `borrowBook()` - Opération 3

- **`app/page.tsx`** - Interface React interactive
  - Affichage des livres en temps réel
  - Formulaires pour créer et emprunter
  - Statuts visuels (disponible/emprunté)

---

## API Endpoints

### Base URL
```
http://localhost:8002/api
```

### 1️⃣ Créer un Livre
```bash
POST /api/books
Content-Type: application/json

{
  "title": "1984",
  "author": "George Orwell",
  "isbn": "978-0451524934"
}

# Response: 201 Created
{
  "id": "38f42105-248b-4b05-aa46-ad6e65113ec1",
  "title": "1984",
  "author": "George Orwell",
  "isbn": "978-0451524934",
  "status": "available",
  "borrowed_by": null,
  "borrow_date": null
}
```

### 2️⃣ Afficher les Livres
```bash
GET /api/books

# Response: 200 OK
[
  {
    "id": "38f42105-248b-4b05-aa46-ad6e65113ec1",
    "title": "1984",
    "status": "available",
    ...
  },
  {
    "id": "7325d2fb-f72c-4c66-8c6e-173950aaa2fd",
    "title": "Le Seigneur des Anneaux",
    "status": "borrowed",
    "borrowed_by": "Alice Dupont",
    ...
  }
]
```

### 3️⃣ Emprunter un Livre
```bash
POST /api/books/{book_id}/borrow
Content-Type: application/json

{
  "borrower_name": "Alice Dupont"
}

# Response: 200 OK
{
  "id": "38f42105-248b-4b05-aa46-ad6e65113ec1",
  "status": "borrowed",
  "borrowed_by": "Alice Dupont",
  "borrow_date": "2026-08-31T17:00:11.759473",
  ...
}
```

---

## Installation & Démarrage

### Backend

```bash
cd back
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 main.py
# API démarrée sur http://localhost:8002
```

### Frontend

```bash
cd front/biblio
npm install
npm run dev
# Frontend accessible sur http://localhost:3000
```

---

## Entités du Domaine

### Book
```python
@dataclass
class Book:
    title: str
    author: str
    isbn: str
    status: BookStatus = BookStatus.AVAILABLE  # enum: "available" | "borrowed"
    id: UUID = field(default_factory=uuid4)
    borrowed_by: str | None = None
    borrow_date: datetime | None = None
    
    def mark_as_borrowed(self, borrower_name: str) -> None
    def mark_as_available(self) -> None
    def is_available(self) -> bool
```

### BookStatus
```python
class BookStatus(str, Enum):
    AVAILABLE = "available"
    BORROWED = "borrowed"
```

---

## Flux d'Exécution

### Opération 1: Créer un Livre
```
Request (HTTP POST) 
  → Route FastAPI (/api/books)
  → CreateBookUseCase.execute()
  → Domain: Vérifier ISBN unique
  → Infrastructure: BookRepository.save()
  → Response: BookDTO
```

### Opération 2: Afficher les Livres
```
Request (HTTP GET)
  → Route FastAPI (/api/books)
  → ListBooksUseCase.execute()
  → Infrastructure: BookRepository.find_all()
  → Domain: Convertir en DTOs
  → Response: List[BookDTO]
```

### Opération 3: Emprunter un Livre
```
Request (HTTP POST)
  → Route FastAPI (/api/books/{id}/borrow)
  → BorrowBookUseCase.execute()
  → Domain: Vérifier disponibilité
  → Domain: Mark as borrowed (règles métier)
  → Infrastructure: BookRepository.update()
  → Response: BookDTO (status="borrowed")
```

---

## Avantages de cette Architecture

1. **Testabilité** - Chaque use case peut être testé indépendamment
2. **Maintenabilité** - Logique métier clairement séparée
3. **Flexibilité** - Repository peut être swappé sans toucher le reste
4. **Clarté** - Les dépendances sont explicites
5. **Évolutivité** - Facile d'ajouter de nouvelles opérations

---

## Prochains Développements

- [ ] Ajouter une base de données PostgreSQL (remplacer InMemoryRepository)
- [ ] Ajouter authentification JWT
- [ ] Ajouter retour de livre (mark as available)
- [ ] Ajouter historique d'emprunts
- [ ] Ajouter recherche par titre/auteur
- [ ] Tests unitaires complets
- [ ] Docker Compose pour développement

