"""Firebase Admin SDK initializer and token verifier."""
import json
import firebase_admin
from firebase_admin import credentials, auth as fb_auth
from fastapi import HTTPException, status
from .config import settings


def _init() -> None:
    """Initialize Firebase Admin SDK once. Safe to call multiple times."""
    if firebase_admin._apps:
        return
    sa = settings.firebase_service_account
    if not sa:
        # No credentials configured — dev bypass mode (token verification skipped)
        return
    try:
        cred_data = json.loads(sa)
        cred = credentials.Certificate(cred_data)
    except (json.JSONDecodeError, ValueError):
        # Treat as a file path
        cred = credentials.Certificate(sa)
    firebase_admin.initialize_app(cred)


_init()


def verify_token(token: str) -> dict:
    """Verify a Firebase ID token. Returns decoded claims dict.

    In dev mode (no service account configured) returns a stub user so
    local development works without credentials.
    """
    if not firebase_admin._apps:
        # Dev bypass — no service account set
        return {"uid": "dev", "email": "dev@local", "name": "Dev User"}
    try:
        return fb_auth.verify_id_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )
