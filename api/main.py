import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — open diskcache and other resources in card #34
    yield
    # Shutdown — close resources in card #34


app = FastAPI(title="Valuation API", version="0.1.0", lifespan=lifespan)

cors_origin = os.environ.get("CORS_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)


if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
