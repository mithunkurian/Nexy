from pydantic import BaseModel
from typing import Optional, List


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class AIAction(BaseModel):
    """Structured action the AI decided to perform."""
    action: str          # e.g. "set_brightness", "turn_on", "turn_off"
    target_ids: List[str] = []
    target_rooms: List[str] = []
    params: dict = {}


class ChatResponse(BaseModel):
    reply: str
    actions_taken: List[AIAction] = []
