"""
Semantic search retriever for legal documents in Qdrant.
"""

from pathlib import Path
from typing import Any

from qdrant_client import QdrantClient
from langchain_openai import OpenAIEmbeddings
from config import settings


def get_qdrant_client() -> QdrantClient:
    """Initialize Qdrant client."""
    return QdrantClient(url=settings.qdrant_url)


def get_embeddings():
    """Initialize OpenAI embeddings."""
    return OpenAIEmbeddings(
        model=settings.embedding_model,
        api_key=settings.openai_api_key,
    )


def legal_retriever(query: str, top_k: int = 5) -> list[dict]:
    """
    Retrieve top-k relevant legal documents from Qdrant.
    
    Args:
        query: Search query string
        top_k: Number of results to return
    
    Returns:
        List of dicts with 'source', 'section', 'content', 'relevance_score'
    """
    try:
        client = get_qdrant_client()
        embeddings = get_embeddings()

        # Embed the query
        query_embedding = embeddings.embed_query(query)

        # Search in Qdrant
        search_result = client.search(
            collection_name=settings.qdrant_collection,
            query_vector=query_embedding,
            limit=top_k,
            with_payload=True,
        )

        # Format results
        results = []
        for point in search_result:
            payload = point.payload or {}
            results.append(
                {
                    "source": payload.get("source", "Unknown"),
                    "section": payload.get("section"),
                    "content": payload.get("content", ""),
                    "relevance_score": point.score,
                }
            )

        return results

    except Exception as e:
        # If Qdrant is unavailable, return empty results
        print(f"Retriever error: {e}")
        return [
            {
                "source": "Error retrieving laws",
                "section": None,
                "content": str(e),
                "relevance_score": 0.0,
            }
        ]


def load_corpus_preview(limit: int = 4) -> list[dict[str, Any]]:
    """Load a few real corpus files for dashboard previewing."""
    from rag.corpus_catalog import list_corpus_sources

    return list_corpus_sources(limit=limit)
