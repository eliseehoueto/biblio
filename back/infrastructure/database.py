"""Database configuration and connection management."""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("NEON_DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("NEON_DATABASE_URL not set in .env file")

# Create engine with pre-ping, recycle and connection timeout
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL debugging
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"connect_timeout": 10},
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
 
# Base class for models
Base = declarative_base()


def ensure_archive_column() -> None:
    """Add the archive column when upgrading an existing database."""
    with engine.begin() as connection:
        connection.execute(text(
            "ALTER TABLE books ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL"
        ))


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
