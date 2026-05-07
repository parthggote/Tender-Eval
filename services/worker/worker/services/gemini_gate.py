from __future__ import annotations

import random
import time
from dataclasses import dataclass
from typing import Optional

import redis

from worker.config import settings


@dataclass(frozen=True)
class _GateKeys:
    cooldown_until: str
    pace: str


class GeminiGate:
    """
    A small Redis-backed "cooldown + pacing" gate shared across Celery worker
    processes. It prevents stampedes where many tasks retry at the same time
    and repeatedly hit 429 rate limits.

    - cooldown: set when we receive 429/503. All callers wait until it passes.
    - pacing: enforces a minimum gap between calls (derived from RPM).

    If Redis is unavailable, the gate becomes a no-op.
    """

    _LUA_SET_MAX = """
local key = KEYS[1]
local new_until = tonumber(ARGV[1])
local ttl_ms = tonumber(ARGV[2])
local cur = tonumber(redis.call('GET', key) or '0')
if new_until > cur then
  redis.call('SET', key, tostring(new_until), 'PX', ttl_ms)
  return new_until
end
return cur
""".strip()

    def __init__(self, *, kind: str, rpm: float, namespace: str | None = None):
        self._kind = kind
        self._rpm = float(rpm or 0.0)
        self._min_interval_s = (60.0 / self._rpm) if self._rpm > 0 else 0.0
        ns = namespace or settings.gemini_gate_namespace
        self._keys = _GateKeys(
            cooldown_until=f"{ns}:{kind}:cooldown_until",
            pace=f"{ns}:{kind}:pace",
        )

        self._redis: Optional[redis.Redis] = None
        try:
            self._redis = redis.Redis.from_url(settings.redis_url, decode_responses=True)
        except Exception:
            # Redis is required for Celery anyway, but keep this resilient in dev.
            self._redis = None

    def wait_turn(self) -> None:
        """Block until we're allowed to make the next remote call."""
        if not self._redis:
            return

        self._wait_for_cooldown()
        self._enforce_min_interval()

    def set_cooldown(self, seconds: float) -> None:
        """Set a shared cooldown (in seconds) if it would extend the current one."""
        if not self._redis:
            return

        seconds = float(seconds or 0.0)
        if seconds <= 0:
            return

        now = time.time()
        new_until = now + seconds
        ttl_ms = int((seconds + 5) * 1000)
        try:
            # Atomically: cooldown_until = max(cooldown_until, new_until)
            self._redis.eval(
                self._LUA_SET_MAX,
                1,
                self._keys.cooldown_until,
                str(new_until),
                str(ttl_ms),
            )
        except Exception:
            # Best effort: if we can't set it, callers will still do local sleeps.
            return

    def _wait_for_cooldown(self) -> None:
        assert self._redis

        while True:
            raw = self._redis.get(self._keys.cooldown_until)
            if not raw:
                return
            try:
                until = float(raw)
            except ValueError:
                # Corrupted value, delete and continue.
                try:
                    self._redis.delete(self._keys.cooldown_until)
                except Exception:
                    pass
                return

            now = time.time()
            if until <= now:
                return

            sleep_s = min(until - now, 30.0)
            time.sleep(sleep_s)

    def _enforce_min_interval(self) -> None:
        assert self._redis

        if self._min_interval_s <= 0:
            return

        ttl_ms = max(1, int(self._min_interval_s * 1000))
        token = f"{time.time()}-{random.random()}"

        while True:
            try:
                ok = self._redis.set(self._keys.pace, token, nx=True, px=ttl_ms)
            except Exception:
                return

            if ok:
                return

            try:
                pttl = int(self._redis.pttl(self._keys.pace))
            except Exception:
                pttl = ttl_ms

            # -2: key doesn't exist; -1: exists but no expire (shouldn't happen here)
            if pttl <= 0:
                wait_s = self._min_interval_s
            else:
                wait_s = pttl / 1000.0

            # Small jitter to avoid thundering herd at exact expiry boundary.
            wait_s = min(wait_s + random.uniform(0.05, 0.25), 10.0)
            time.sleep(wait_s)


gemini_generate_gate = GeminiGate(kind="generate", rpm=settings.gemini_generate_rpm)
gemini_embed_gate = GeminiGate(kind="embed", rpm=settings.gemini_embed_rpm)

