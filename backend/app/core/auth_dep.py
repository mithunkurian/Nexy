"""FastAPI dependency for Firebase authentication."""
from fastapi import Header, HTTPException, status
from .firebase_admin_init import verify_token, get_user_profile


async def get_current_user(authorization: str = Header(default="")) -> dict:
    """Extract and verify the Bearer token from the Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = authorization[len("Bearer "):]
    decoded = verify_token(token)
    profile = get_user_profile(decoded["uid"])
    return {**decoded, "profile": profile}
