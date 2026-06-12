from __future__ import annotations
import os
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import health, stocks, fiis
from api.middleware import RateLimitMiddleware
from api.cache import cache_close


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    cache_close()


app = FastAPI(title="Valuation API", version="0.1.0", lifespan=lifespan)

cors_origins_raw = os.environ.get("CORS_ORIGIN", "*")
cors_origins = (
    [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
    if cors_origins_raw != "*"
    else ["*"]
)
app.add_middleware(CORSMiddleware, allow_origins=cors_origins, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(RateLimitMiddleware)
app.include_router(health.router)
app.include_router(stocks.router)
app.include_router(fiis.router)

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
