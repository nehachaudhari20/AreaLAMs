# vector_db/add_to_db.py

from vectordb.chroma_client import get_chroma_collection 

def add_failure_summary(doc_text, txn_id, service, error_code):
    collection = get_chroma_collection()

    doc_id = f"log_{txn_id[:8]}"
    metadata = {
        "txn_id": txn_id,
        "service": service,
        "error_code": error_code
    }

    collection.add(
        documents=[doc_text],
        metadatas=[metadata],
        ids=[doc_id]
    )
    print(f"Added to ChromaDB: {doc_text} (txn: {txn_id})")
