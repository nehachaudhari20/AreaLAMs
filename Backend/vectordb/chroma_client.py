# vector_db/chroma_client.py

import chromadb

# New way to initialize a persistent Chroma client
client = chromadb.PersistentClient(path="./backend/vector_db/vector_store")

# Create or get collection
collection = client.get_or_create_collection("failure_patterns")

def get_chroma_collection():
    return collection
