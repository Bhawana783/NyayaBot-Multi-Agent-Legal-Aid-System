"""
Ingest legal documents into Qdrant vector database.
"""

import os
import json
from pathlib import Path
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from langchain_openai import OpenAIEmbeddings
from config import settings
from typing import Any


def load_corpus_files(corpus_dir: str = "backend/data/corpus") -> list[dict[str, Any]]:
    """
    Load all .txt files from corpus directory.
    
    Returns:
        List of dicts with 'filename', 'content', 'act_name', 'year'
    """
    documents = []
    corpus_path = Path(corpus_dir)

    if not corpus_path.exists():
        print(f"Corpus directory not found: {corpus_dir}")
        return documents

    for file_path in corpus_path.glob("*.txt"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                # Extract metadata from filename if available
                filename = file_path.stem
                doc = {
                    "filename": filename,
                    "content": content,
                    "act_name": filename.replace("_", " ").title(),
                    "year": 2024,  # Default; could be extracted from content
                }
                documents.append(doc)
                print(f"Loaded: {filename}")
        except Exception as e:
            print(f"Error loading {file_path}: {e}")

    return documents


def chunk_documents(documents: list[dict[str, Any]], chunk_size: int = 500, overlap: int = 50):
    """
    Split documents into chunks for embedding.
    
    Returns:
        List of (chunk_text, metadata) tuples
    """
    def _simple_split(text: str, size: int, ov: int):
        if not text:
            return []
        chunks_local = []
        start = 0
        length = len(text)
        while start < length:
            end = min(start + size, length)
            chunks_local.append(text[start:end])
            start = end - ov if end - ov > start else end
        return chunks_local

    chunks = []
    for doc in documents:
        # Try to use langchain splitter if available, otherwise fallback to simple splitter
        try:
            from langchain.text_splitter import RecursiveCharacterTextSplitter

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=overlap,
                separators=["\n\n", "\n", " ", ""],
            )
            split_text = splitter.split_text(doc["content"])
        except Exception:
            split_text = _simple_split(doc["content"], chunk_size, overlap)

        for chunk in split_text:
            chunks.append(
                (
                    chunk,
                    {
                        "source": doc["act_name"],
                        "filename": doc["filename"],
                        "year": doc["year"],
                        "content": chunk,
                    },
                )
            )

    return chunks


def embed_and_upload_to_qdrant(chunks: list[tuple[str, dict[str, Any]]], embeddings, client: QdrantClient):
    """
    Embed chunks and upload to Qdrant.
    """
    vectors = []

    for idx, (chunk_text, metadata) in enumerate(chunks):
        try:
            # Embed the chunk
            embedding = embeddings.embed_query(chunk_text)

            # Create point
            point = PointStruct(
                id=idx,
                vector=embedding,
                payload=metadata,
            )
            vectors.append(point)

            if idx % 100 == 0:
                print(f"Embedded {idx} chunks...")

        except Exception as e:
            print(f"Error embedding chunk {idx}: {e}")

    # Upload to Qdrant
    if vectors:
        try:
            client.upsert(
                collection_name=settings.qdrant_collection,
                points=vectors,
            )
            print(f"Uploaded {len(vectors)} vectors to Qdrant")
        except Exception as e:
            print(f"Error uploading to Qdrant: {e}")


def ingest_corpus(corpus_dir: str = "backend/data/corpus"):
    """
    Main ingestion pipeline: load → chunk → embed → upload.
    """
    print("Starting corpus ingestion...")

    # Initialize clients
    client = QdrantClient(url=settings.qdrant_url)
    embeddings = OpenAIEmbeddings(
        model=settings.embedding_model,
        api_key=settings.openai_api_key,
    )

    # Check/create collection
    try:
        collection_info = client.get_collection(settings.qdrant_collection)
        print(f"Collection exists with {collection_info.points_count} points")
    except Exception:
        print(f"Creating collection: {settings.qdrant_collection}")
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(
                size=1536,  # text-embedding-3-small dimension
                distance=Distance.COSINE,
            ),
        )

    # Load documents
    documents = load_corpus_files(corpus_dir)
    if not documents:
        print("No documents found to ingest")
        return

    # Chunk documents
    chunks = chunk_documents(documents)
    print(f"Created {len(chunks)} chunks")

    # Embed and upload
    embed_and_upload_to_qdrant(chunks, embeddings, client)
    print("Ingestion complete!")


if __name__ == "__main__":
    ingest_corpus()
