# memory/db.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from memory.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_engine():
    return engine

def get_session():
    return SessionLocal()
