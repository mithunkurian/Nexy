from fastapi import APIRouter
from .routes import devices, ai, ws

api_router = APIRouter()
api_router.include_router(devices.router)
api_router.include_router(ai.router)
api_router.include_router(ws.router)
