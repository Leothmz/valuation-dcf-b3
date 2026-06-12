from __future__ import annotations
import collections
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

RATE_LIMIT_REQUESTS = 60
RATE_LIMIT_WINDOW = 60.0

_rate_lock = __import__("threading").Lock()
_rate_windows: dict[str, collections.deque] = collections.defaultdict(collections.deque)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit(ip: str) -> bool:
    """Return True if request is allowed, False if rate-limited."""
    now = time.time()
    with _rate_lock:
        window = _rate_windows[ip]
        # Evict timestamps older than the window
        while window and now - window[0] >= RATE_LIMIT_WINDOW:
            window.popleft()
        if len(window) >= RATE_LIMIT_REQUESTS:
            return False
        window.append(now)
        return True


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only rate-limit API paths
        if not request.url.path.startswith("/api/"):
            return await call_next(request)

        ip = _get_client_ip(request)
        if not _check_rate_limit(ip):
            return JSONResponse(
                {"error": "rate_limit_exceeded", "retry_after": 60},
                status_code=429,
            )
        return await call_next(request)
