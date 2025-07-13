import chromadb
from chromadb.config import Settings

# Disable telemetry here
settings = Settings(anonymized_telemetry=False)

client = chromadb.PersistentClient(path="./backend/vector_db/vector_store", settings=settings)
collection = client.get_or_create_collection("failure_patterns")

def get_chroma_collection():
    return collection
