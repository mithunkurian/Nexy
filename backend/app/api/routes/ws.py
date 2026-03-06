"""WebSocket endpoint for real-time device state updates."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ...core.websocket import manager
import structlog

log = structlog.get_logger()
router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            # Keep connection alive; server pushes events proactively
            data = await ws.receive_text()
            # Echo ping/pong for keepalive
            if data == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(ws)
