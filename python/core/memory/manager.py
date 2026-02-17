"""
Physiclaw 3-tier local memory. No external API calls.
All embedding models must be run locally when L3 is used.
"""

from __future__ import annotations

import os
import re
import sqlite3
from collections import OrderedDict
from pathlib import Path
from typing import Any

# Optional: lancedb for L3. Fail at runtime if not installed.
try:
    import lancedb
except ImportError:
    lancedb = None

BASE_DIR = Path(os.getenv("PHYSICLAW_MEMORY_DIR", ".physiclaw")).expanduser()
L2_PATH = BASE_DIR / "memory_l2.sqlite3"
L3_PATH = BASE_DIR / "memory_l3.lance"

# Patterns and strings to strip before logs hit memory (no phone-home / telemetry).
TELEMETRY_PATTERNS = [
    re.compile(r"https?://[^\s]+(?:posthog|segment|analytics|telemetry|ph\.|sentry\.io)[^\s]*", re.I),
    re.compile(r"\b(?:posthog|segment|mixpanel|amplitude|fullstory)\s*[=:]\s*[^\s]+", re.I),
    re.compile(r"api[_-]?key\s*[=:]\s*[^\s]+", re.I),
    re.compile(r"token\s*[=:]\s*[^\s]+", re.I),
]
TELEMETRY_STRINGS = [
    "phone-home",
    "phone_home",
    "telemetry",
    "send_analytics",
    "report_usage",
    "ph.",
    "posthog",
    "segment.com",
]


def clean_telemetry(text: str) -> str:
    """
    Scrub metadata and phone-home strings from log content before it hits any memory tier.
    Call this on every string before L1/L2/L3 write.
    """
    if not text or not isinstance(text, str):
        return text
    out = text
    for pat in TELEMETRY_PATTERNS:
        out = pat.sub("[REDACTED]", out)
    for s in TELEMETRY_STRINGS:
        out = out.replace(s, "[REDACTED]")
    return out


# --- Tier 1: L1 Ephemeral (in-memory LRU) ------------------------------------


class LRUCache:
    """In-memory LRU cache for immediate context. Volatile, not persisted."""

    def __init__(self, capacity: int = 1024):
        self.capacity = capacity
        self._data: OrderedDict[str, str] = OrderedDict()

    def get(self, key: str) -> str | None:
        if key not in self._data:
            return None
        self._data.move_to_end(key)
        return self._data[key]

    def put(self, key: str, value: str) -> None:
        value = clean_telemetry(value)
        if key in self._data:
            self._data.move_to_end(key)
        else:
            if len(self._data) >= self.capacity:
                self._data.popitem(last=False)
        self._data[key] = value

    def clear(self) -> None:
        self._data.clear()


# --- Tier 2: L2 Factual (SQLite FTS5) ----------------------------------------


class L2Store:
    """SQLite FTS5 for structured infrastructure state lookups."""

    def __init__(self, path: Path | None = None):
        path = path or L2_PATH
        path.parent.mkdir(parents=True, exist_ok=True)
        self._path = path
        self._conn = sqlite3.connect(str(path))
        self._init_schema()

    def _init_schema(self) -> None:
        cur = self._conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS facts (
                id TEXT PRIMARY KEY,
                body TEXT NOT NULL,
                tags TEXT DEFAULT '',
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            );
            """
        )
        cur.execute(
            """
            CREATE VIRTUAL TABLE IF NOT EXISTS facts_fts USING fts5(
                body,
                tags,
                content='facts',
                content_rowid='rowid'
            );
            """
        )
        cur.execute(
            """
            CREATE TRIGGER IF NOT EXISTS facts_ai AFTER INSERT ON facts BEGIN
                INSERT INTO facts_fts(rowid, body, tags) VALUES (new.rowid, new.body, new.tags);
            END;
            """
        )
        cur.execute(
            """
            CREATE TRIGGER IF NOT EXISTS facts_ad AFTER DELETE ON facts BEGIN
                INSERT INTO facts_fts(facts_fts, rowid, body, tags) VALUES ('delete', old.rowid, old.body, old.tags);
            END;
            """
        )
        self._conn.commit()

    def add(self, body: str, tags: str = "") -> None:
        body = clean_telemetry(body)
        cur = self._conn.cursor()
        cur.execute(
            "INSERT INTO facts (id, body, tags) VALUES (hex(randomblob(8)), ?, ?)",
            (body, tags),
        )
        self._conn.commit()

    def search(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        cur = self._conn.cursor()
        cur.execute(
            """
            SELECT f.id, f.body, f.tags, f.created_at
            FROM facts_fts fts
            JOIN facts f ON f.rowid = fts.rowid
            WHERE facts_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (query, limit),
        )
        rows = cur.fetchall()
        return [
            {"id": r[0], "body": r[1], "tags": r[2], "created_at": r[3]}
            for r in rows
        ]


# --- Tier 3: L3 Semantic (LanceDB) --------------------------------------------


class L3Store:
    """Local LanceDB for semantic search. Embeddings must be computed locally."""

    def __init__(self, path: Path | None = None):
        path = path or L3_PATH
        path.parent.mkdir(parents=True, exist_ok=True)
        self._path = path
        if lancedb is None:
            raise RuntimeError("lancedb is not installed; pip install lancedb")
        self._db = lancedb.connect(str(path.parent))
        self._table_name = "semantic"
        if self._table_name not in self._db.table_names():
            self._db.create_table(
                self._table_name,
                data=[{"id": "", "text": "", "source": "", "vector": [0.0] * 384}],
            )
        self._table = self._db.open_table(self._table_name)

    def add(self, text: str, source: str = "", vector: list[float] | None = None) -> None:
        text = clean_telemetry(text)
        if vector is None:
            vector = [0.0] * 384  # placeholder; replace with local embedder
        import uuid
        row = {"id": str(uuid.uuid4()), "text": text, "source": source, "vector": vector}
        self._table.add([row])

    def search(self, vector: list[float], limit: int = 10) -> list[dict[str, Any]]:
        rs = self._table.search(vector).limit(limit)
        return [dict(row) for row in rs.to_pylist()]


# --- Manager facade ----------------------------------------------------------


class MemoryManager:
    """Single entry point for L1/L2/L3. All writes go through clean_telemetry."""

    def __init__(
        self,
        l1_capacity: int = 1024,
        l2_path: Path | None = None,
        l3_path: Path | None = None,
    ):
        self.l1 = LRUCache(capacity=l1_capacity)
        self.l2 = L2Store(path=l2_path)
        self.l3: L3Store | None = None
        try:
            self.l3 = L3Store(path=l3_path)
        except Exception:
            pass

    def clean_telemetry(self, text: str) -> str:
        return clean_telemetry(text)
