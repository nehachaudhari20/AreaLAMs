# reset_chroma_collection.py

from chroma_client import get_chroma_collection

def reset_chroma_collection():
    collection = get_chroma_collection()

    # Fetch all IDs (returned by default)
    results = collection.get()  # No include=["ids"]
    all_ids = results["ids"]

    if not all_ids:
        print("🟢 Collection is already empty.")
        return

    # Delete all documents
    collection.delete(ids=all_ids)
    print(f"🗑️ Deleted {len(all_ids)} documents from ChromaDB collection.")

if __name__ == "__main__":
    reset_chroma_collection()
