from pydantic import BaseModel
from typing import Optional

class UserSession(BaseModel):
    user_id: int
    role: str
    token: str
    expires_at: Optional[str]
