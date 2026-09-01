# Structure Complète du Projet Biblio

```
Biblio/
│
├── 📄 README.md                    # Documentation générale
├── 📄 .env.example                 # Configuration exemple
├── 📄 start.sh                     # Script de démarrage complet
│
├── 📁 back/                        # Backend FastAPI
│   ├── 📄 main.py                  # Point d'entrée
│   ├── 📄 pyproject.toml          # Config projet Python
│   ├── 📄 requirements.txt          # Dépendances
│   ├── 📄 ARCHITECTURE.md          # Documentation architecture
│   ├── 📄 README.md                # Documentation backend
│   ├── 📄 test_api.sh              # Script de test
│   ├── 📄 .env                     # Variables d'environnement
│   ├── 📄 .gitignore              # Fichiers ignorés
│   │
│   ├── 📁 domain/                  # 🎯 Couche Domain
│   │   ├── __init__.py
│   │   ├── entities.py             # Entité Book, BookStatus enum
│   │   └── ports.py                # Interface BookRepository
│   │
│   ├── 📁 application/             # 🔧 Couche Application
│   │   ├── __init__.py
│   │   ├── dtos.py                 # CreateBookRequest, BookDTO, etc.
│   │   └── use_cases.py            # 3 Use Cases:
│   │                               #   - CreateBookUseCase
│   │                               #   - ListBooksUseCase
│   │                               #   - BorrowBookUseCase
│   │
│   ├── 📁 infrastructure/          # 🛠️ Couche Infrastructure
│   │   ├── __init__.py
│   │   └── repositories.py         # InMemoryBookRepository
│   │
│   ├── 📁 interfaces/              # 🌐 Couche Interfaces
│   │   ├── __init__.py
│   │   ├── app.py                  # Factory FastAPI
│   │   └── routes.py               # Endpoints API
│   │
│   └── 📁 venv/                    # Environnement virtuel
│
├── 📁 front/                       # Frontend Next.js
│   └── 📁 biblio/
│       ├── 📄 package.json
│       ├── 📄 tsconfig.json
│       ├── 📄 .env.local           # API_URL=http://localhost:8002
│       ├── 📄 next.config.ts
│       ├── 📄 eslint.config.mjs
│       ├── 📄 postcss.config.mjs
│       │
│       ├── 📁 app/
│       │   ├── 📄 page.tsx         # Interface utilisateur principale
│       │   ├── 📄 layout.tsx       # Layout
│       │   └── 📄 globals.css      # Styles globaux
│       │
│       ├── 📁 lib/
│       │   └── 📄 api.ts           # Client API TypeScript
│       │                           #   - createBook()
│       │                           #   - listBooks()
│       │                           #   - borrowBook()
│       │
│       └── 📁 public/              # Assets statiques

```

## Fichiers Clés par Rôle

### 🎯 Domaine Métier
- `back/domain/entities.py` - Entité Book avec règles métier
- `back/domain/ports.py` - Contrat BookRepository

### 🔧 Logique Métier
- `back/application/use_cases.py` - 3 opérations principales
- `back/application/dtos.py` - Transferts de données

### 🛠️ Implémentation
- `back/infrastructure/repositories.py` - Stockage in-memory

### 🌐 API HTTP
- `back/interfaces/routes.py` - Endpoints REST
- `back/interfaces/app.py` - Configuration FastAPI

### 💻 Frontend
- `front/biblio/lib/api.ts` - Client API TypeScript
- `front/biblio/app/page.tsx` - Interface utilisateur

## Points d'Entrée

### Backend
```bash
cd back && source venv/bin/activate && python3 main.py
# → http://localhost:8002
# → Swagger UI: http://localhost:8002/docs
```

### Frontend
```bash
cd front/biblio && npm run dev
# → http://localhost:3000
```

### Test Complet
```bash
./back/test_api.sh
```

## Communication

```
Frontend (Next.js)
    ↓ (HTTP Client)
├─ POST   /api/books                 ← Créer un livre
├─ GET    /api/books                 ← Lister les livres
└─ POST   /api/books/{id}/borrow     ← Emprunter un livre
    ↓ (HTTP Server)
Backend (FastAPI)
    ↓ (Inversion of Control)
├─ Application Layer (Use Cases)
├─ Domain Layer (Entités + Règles)
└─ Infrastructure Layer (Repository)
```

## Technologies

### Backend
- Python 3.9+
- FastAPI 0.104+
- Pydantic 2.4+
- Uvicorn (serveur ASGI)

### Frontend
- Next.js 15+
- TypeScript
- React Hooks
- Tailwind CSS

### Architecture
- Hexagonale (Ports & Adapters)
- Injection de dépendances
- Séparation des concerns
- Clean Architecture

## État du Projet

✅ Domain Layer (Entités + Ports)
✅ Application Layer (Use Cases)
✅ Infrastructure Layer (Repository)
✅ Interfaces Layer (FastAPI Routes)
✅ Frontend (Next.js + API Client)
✅ Tests (Script test_api.sh)
✅ Documentation (README + ARCHITECTURE)

## Prochaines Étapes Recommandées

1. **Base de données** - Remplacer InMemoryRepository par PostgreSQL
2. **Tests unitaires** - Ajouter pytest pour tester les use cases
3. **Authentification** - JWT pour sécuriser l'API
4. **Retour de livre** - Ajouter endpoint pour marquer comme disponible
5. **Historique** - Tracer tous les emprunts/retours
6. **Docker** - Containeriser backend et frontend
7. **CI/CD** - GitHub Actions pour tests et déploiement
