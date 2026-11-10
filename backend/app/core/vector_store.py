"""
MediSphere AI — Qdrant Vector Store Manager

Handles semantic embeddings generation via sentence-transformers and upsert/search transactions with Qdrant Vector DB.
"""
import uuid
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from app.core.config import settings


class VectorStore:
    """
    Coordinator managing Qdrant semantic document indices.
    """
    def __init__(self):
        self.client = None
        self.encoder = None
        self.is_active = False
        
        try:
            print(f"Connecting to Qdrant at {settings.QDRANT_URL}...")
            try:
                self.client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None,
                    check_compatibility=False,
                    timeout=1
                )
                self.client.get_collections()
                print("Connected to remote Qdrant Vector DB!")
            except Exception:
                print("Remote Qdrant not running — initializing Embedded In-Memory Qdrant Vector Store...")
                self.client = QdrantClient(location=":memory:")
                print("Embedded In-Memory Qdrant initialized successfully!")

            # Load lightweight encoder locally
            print("Loading sentence-transformers encoder...")
            from sentence_transformers import SentenceTransformer
            self.encoder = SentenceTransformer(settings.EMBEDDING_MODEL)
            self.is_active = True
            print("Qdrant Vector Store initialized successfully!")
        except Exception as e:
            print(f"WARNING: Qdrant or embedding encoder initialization failed. RAG fallback mode active. Error: {e}")
            self.is_active = False

    def create_collection_if_not_exists(self, collection_name: str, vector_size: int = 384):
        """Create a Qdrant collection if it does not exist already."""
        if not self.is_active or not self.client:
            return
            
        try:
            collections_res = self.client.get_collections()
            existing = [c.name for c in collections_res.collections]
            
            if collection_name not in existing:
                print(f"Creating Qdrant collection '{collection_name}'...")
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=vector_size,
                        distance=qmodels.Distance.COSINE
                    )
                )
        except Exception as e:
            print(f"WARNING: Failed to create Qdrant collection '{collection_name}': {e}. Disabling vector store.")
            self.is_active = False

    def upsert_document(self, collection_name: str, text: str, payload: dict[str, Any]):
        """Embed text and insert it into Qdrant index."""
        if not self.is_active or not self.client or not self.encoder:
            return
            
        try:
            self.create_collection_if_not_exists(collection_name)
            vector = self.encoder.encode(text).tolist()
            doc_id = str(uuid.uuid4())
            
            self.client.upsert(
                collection_name=collection_name,
                points=[
                    qmodels.PointStruct(
                        id=doc_id,
                        vector=vector,
                        payload={**payload, "text_content": text}
                    )
                ]
            )
        except Exception as e:
            print(f"WARNING: Qdrant upsert failed: {e}")

    def search_documents(self, collection_name: str, query: str, limit: int = 3) -> list[dict[str, Any]]:
        """Search Qdrant for semantic neighbors of query text."""
        if not self.is_active or not self.client or not self.encoder:
            return []
            
        try:
            self.create_collection_if_not_exists(collection_name)
            query_vector = self.encoder.encode(query).tolist()
            
            search_result = self.client.query_points(
                collection_name=collection_name,
                query=query_vector,
                limit=limit
            ).points
            
            results = []
            for hit in search_result:
                results.append({
                    "id": hit.id,
                    "score": hit.score,
                    "payload": hit.payload
                })
            return results
        except Exception as e:
            print(f"WARNING: Qdrant search failed: {e}. Disabling vector store.")
            self.is_active = False
            return []

# Singleton instance
vector_store = VectorStore()
