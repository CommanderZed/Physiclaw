"""
Functional 3-tier memory engine: L2 infrastructure facts (SQLite FTS5),
L3 semantic store (LanceDB) for docs and logs, with optional local reranker.

Proves the agent can "remember" infrastructure details without calling a cloud vector DB.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from .manager import (
    BASE_DIR,
    L2_PATH,
    L3_PATH,
    MemoryManager,
    clean_telemetry,
)

logger = logging.getLogger(__name__)

# Optional local embedder (e.g. sentence-transformers). L3 vectors default to placeholder if missing.
_embedder = None


def _get_embedder():
    global _embedder
    if _embedder is not None:
        return _embedder
    try:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
        return _embedder
    except ImportError:
        return None


# Optional reranker (e.g. bge-reranker-base). Improves RAG quality without cloud.
_reranker_model = None


def _get_reranker():
    global _reranker_model
    if _reranker_model is not None:
        return _reranker_model
    try:
        from sentence_transformers import CrossEncoder
        _reranker_model = CrossEncoder("BAAI/bge-reranker-base", max_length=512)
        return _reranker_model
    except Exception:
        try:
            from FlagEmbedding import FlagReranker
            _reranker_model = FlagReranker("BAAI/bge-reranker-base", use_fp16=True)
            return _reranker_model
        except ImportError:
            return None


def embed_text(text: str) -> list[float]:
    """Return 384-dim vector for text. Placeholder zeros if no local embedder."""
    emb = _get_embedder()
    if emb is None:
        return [0.0] * 384
    vec = emb.encode(clean_telemetry(text), normalize_embeddings=True)
    return vec.tolist()


def rerank_query_docs(query: str, docs: list[str], top_k: int = 5) -> list[tuple[int, float]]:
    """
    Rerank documents by relevance to query. Returns list of (original_index, score) for top_k.
    If no reranker is installed, returns [(0, 0.0), ...] for first top_k.
    """
    model = _get_reranker()
    if model is None or not docs:
        return [(i, 0.0) for i in range(min(top_k, len(docs)))]
    try:
        if hasattr(model, "compute_score"):  # FlagReranker: pairs of [query, doc]
            pairs = [[query, d] for d in docs]
            s = model.compute_score(pairs)
            if not isinstance(s, list):
                s = [s]
            indexed = [(i, float(s[i]) if i < len(s) else 0.0) for i in range(len(docs))]
            indexed.sort(key=lambda x: -x[1])
            return indexed[:top_k]
        # CrossEncoder
        inputs = [[query, d] for d in docs]
        scores = model.predict(inputs)
        if not hasattr(scores, "__len__"):
            scores = [scores]
        indexed = [(i, float(scores[i]) if i < len(scores) else 0.0) for i in range(len(docs))]
        indexed.sort(key=lambda x: -x[1])
        return indexed[:top_k]
    except Exception as e:
        logger.warning("Reranker failed, returning unranked: %s", e)
        return [(i, 0.0) for i in range(min(top_k, len(docs)))]


class MemoryEngine:
    """
    High-level memory: L2 for infrastructure facts (cluster names, IP maps),
    L3 for semantic search over .md docs and historical logs. Optional reranker for RAG quality.
    """

    def __init__(
        self,
        manager: MemoryManager | None = None,
        l2_path: Path | None = None,
        l3_path: Path | None = None,
    ):
        self._manager = manager or MemoryManager(l2_path=l2_path, l3_path=l3_path)
        self.l1 = self._manager.l1
        self.l2 = self._manager.l2
        self.l3 = self._manager.l3

    def add_infrastructure_fact(self, name: str, value: str, tags: str = "") -> None:
        """Index a structured fact (e.g. cluster name, IP map) into L2 FTS5."""
        body = f"{name}: {value}"
        self.l2.add(body, tags=tags or "infra")

    def search_infrastructure(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        """Full-text search over infrastructure facts in L2."""
        return self.l2.search(query, limit=limit)

    def add_document(self, text: str, source_path: str = "") -> None:
        """Add .md or other documentation to L3 for semantic search."""
        text = clean_telemetry(text)
        vector = embed_text(text)
        if self.l3:
            self.l3.add(text, source=source_path or "doc", vector=vector)

    def add_log_chunk(self, text: str, source: str = "") -> None:
        """Add a historical log chunk to L3."""
        text = clean_telemetry(text)
        vector = embed_text(text)
        if self.l3:
            self.l3.add(text, source=source or "log", vector=vector)

    def search_semantic(self, query: str, limit: int = 10) -> list[dict[str, Any]]:
        """Semantic search in L3. Returns list of {text, source, id, ...}."""
        if not self.l3:
            return []
        qvec = embed_text(query)
        return self.l3.search(qvec, limit=limit)

    def retrieve_for_llm(
        self,
        query: str,
        l2_limit: int = 10,
        l3_limit: int = 15,
        rerank_top: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Combined retrieval: L2 keyword + L3 semantic, then optional local rerank.
        Returns list of items with 'text', 'source', 'score', 'tier' (l2|l3).
        """
        results: list[dict[str, Any]] = []
        for row in self.search_infrastructure(query, limit=l2_limit):
            results.append({
                "text": row.get("body", ""),
                "source": row.get("tags", "l2"),
                "score": 1.0,
                "tier": "l2",
                "id": row.get("id"),
            })
        for row in self.search_semantic(query, limit=l3_limit):
            results.append({
                "text": row.get("text", ""),
                "source": row.get("source", "l3"),
                "score": 0.0,
                "tier": "l3",
                "id": row.get("id"),
            })
        if not results:
            return []
        if rerank_top > 0 and results:
            docs = [r["text"] for r in results]
            ranked = rerank_query_docs(query, docs, top_k=rerank_top)
            ordered: list[dict[str, Any]] = []
            for idx, score in ranked:
                if 0 <= idx < len(results):
                    r = {**results[idx], "score": score}
                    ordered.append(r)
            return ordered
        return results[: max(l2_limit, l3_limit)]
