"""WebSocket endpoint for real-time device state updates."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ...core.websocket import manager
from ...core.firebase_admin_init import verify_token, get_user_profile
from fastapi import HTTPException
import structlog

log = structlog.get_logger()
router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = ""):
    # Verify token before accepting the connection
    try:
        decoded = verify_token(token)
        get_user_profile(decoded["uid"])
    except HTTPException:
        await ws.close(code=1008)  # 1008 = Policy Violation
        return
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
