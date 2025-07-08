# vector_db/query_db.py

from vectordb.chroma_client import get_chroma_collection

def query_similar_logs(query_text, top_k=3):
    collection = get_chroma_collection()
    results = collection.query(
        query_texts=[query_text],
        n_results=top_k
    )

    matches = []
    for doc, metadata in zip(results["documents"][0], results["metadatas"][0]):
        matches.append({
            "document": doc,
            "metadata": metadata
        })

    return matches
