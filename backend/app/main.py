"""Nexy — Smart Home AI Backend"""
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .api import api_router
from .integrations.registry import get_registry

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("nexy_starting", env=settings.app_env)
    registry = get_registry()
    await registry.connect_all()
    yield
    await registry.disconnect_all()
    log.info("nexy_stopped")


app = FastAPI(
    title="Nexy Smart Home API",
    description="AI-powered smart home control for IKEA & Matter devices",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
