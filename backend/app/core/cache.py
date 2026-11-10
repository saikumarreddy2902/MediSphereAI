"""
MediSphere AI — Async Redis Cache Client

Provides a simple async get/set/invalidate cache layer backed by Redis.
Used to reduce MongoDB load on high-read endpoints (dashboard, beds, analytics).

Usage:
    from app.core.cache import cache
    await cache.set("key", data, ttl=300)
    data = await cache.get("key")
    await cache.invalidate("key")
"""
import json
import time
from datetime import timedelta
from typing import Any

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from loguru import logger

from app.core.config import settings


class RedisCache:
    """
    Async cache with Redis backend, automatically falling back to high-speed in-memory TTL cache
    when Redis is offline.
    """

    def __init__(self) -> None:
        self._client: Any = None
        self._in_memory: dict[str, tuple[float, Any]] = {}

    async def connect(self) -> None:
        """Initialize the async Redis connection pool or fallback to in-memory cache."""
        if not REDIS_AVAILABLE:
            logger.info("redis[asyncio] not installed — running with high-speed in-memory TTL cache.")
            return
        try:
            self._client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
            )
            await self._client.ping()
            logger.info(f"Redis cache connected: {settings.REDIS_URL}")
        except Exception:
            logger.info("Redis server offline — seamless In-Memory TTL Cache activated.")
            self._client = None

    async def disconnect(self) -> None:
        """Close the Redis connection pool."""
        if self._client:
            await self._client.aclose()
        self._in_memory.clear()

    async def get(self, key: str) -> Any | None:
        """Return cached value for key, or None on miss/expiry."""
        if not self._client:
            entry = self._in_memory.get(key)
            if not entry:
                return None
            expire_at, value = entry
            if time.time() > expire_at:
                del self._in_memory[key]
                return None
            return value

        try:
            raw = await self._client.get(key)
            return json.loads(raw) if raw else None
        except Exception:
            return None

    async def set(self, key: str, value: Any, ttl: int = settings.REDIS_TTL) -> None:
        """Serialize and store value with TTL (seconds)."""
        if not self._client:
            self._in_memory[key] = (time.time() + ttl, value)
            return

        try:
            await self._client.setex(key, timedelta(seconds=ttl), json.dumps(value, default=str))
        except Exception:
            self._in_memory[key] = (time.time() + ttl, value)

    async def invalidate(self, key: str) -> None:
        """Delete a cache entry."""
        if key in self._in_memory:
            del self._in_memory[key]

        if self._client:
            try:
                await self._client.delete(key)
            except Exception:
                pass

    async def invalidate_pattern(self, pattern: str) -> None:
        """Delete all keys matching pattern."""
        prefix = pattern.replace("*", "")
        keys_to_del = [k for k in self._in_memory if prefix in k]
        for k in keys_to_del:
            self._in_memory.pop(k, None)

        if self._client:
            try:
                keys = await self._client.keys(pattern)
                if keys:
                    await self._client.delete(*keys)
            except Exception:
                pass


# Singleton cache instance
cache = RedisCache()
