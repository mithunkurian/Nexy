"""Firebase Admin SDK initializer and token verifier."""
import json
import firebase_admin
from firebase_admin import credentials, auth as fb_auth, firestore
from fastapi import HTTPException, status
from .config import settings


def _init() -> None:
    """Initialize Firebase Admin SDK once. Safe to call multiple times."""
    if firebase_admin._apps:
        return
    sa = settings.firebase_service_account
    if not sa:
        return
    try:
        cred_data = json.loads(sa)
        cred = credentials.Certificate(cred_data)
    except (json.JSONDecodeError, ValueError):
        cred = credentials.Certificate(sa)
    firebase_admin.initialize_app(cred)


_init()


def verify_token(token: str) -> dict:
    if not firebase_admin._apps:
        return {"uid": "dev", "email": "dev@local", "name": "Dev User", "role": "admin"}
    try:
        return fb_auth.verify_id_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )


def get_user_profile(uid: str) -> dict:
    if not firebase_admin._apps:
        return {"uid": "dev", "email": "dev@local", "displayName": "Dev User", "role": "admin", "disabled": False}

    doc = firestore.client().collection("users").document(uid).get()
    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not approved for Nexy",
        )

    profile = doc.to_dict()
    if profile.get("disabled"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This Nexy account is disabled",
        )

    if profile.get("role") not in {"admin", "family"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This Nexy account is not approved yet",
        )

    return profile
