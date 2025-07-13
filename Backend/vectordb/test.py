# vectordb/test.py

import chromadb

try:
    # Make sure the client path is correct and matches your chroma_client.py
    client = chromadb.PersistentClient(path="./backend/vector_db/vector_store")

    print("🔍 Existing collections:")
    for col in client.list_collections():
        print(" -", col.name)

    # Attempt to delete the collection
    client.delete_collection(name="failure_patterns")
    print("🗑️ Deleted collection: failure_patterns")

    # Recreate a fresh collection
    client.create_collection(name="failure_patterns")
    print("✅ Recreated collection: failure_patterns")

except Exception as e:
    print("❌ Error during Chroma reset:", e)
