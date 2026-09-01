"""Script to initialize the database."""
import os
from dotenv import load_dotenv
from infrastructure.database import engine, Base
from infrastructure.models import BookModel

load_dotenv()

def init_db():
    """Create all tables in the database."""
    print("🔄 Initializing database...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database initialized successfully!")
        print(f"📊 Tables created: {list(Base.metadata.tables.keys())}")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise

if __name__ == "__main__":
    init_db()
