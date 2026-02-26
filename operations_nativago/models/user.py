from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    OPERATIONS = "operations"
    SUPPORT = "support"
    PARTNER = "partner"
    USER = "user"

class User(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

class UserCreate(BaseModel):
    email: str
    full_name: str
    role: UserRole
    password: str

class UserUpdate(BaseModel):
    email: Optional[str]
    full_name: Optional[str]
    role: Optional[UserRole]
    is_active: Optional[bool]
    password: Optional[str]
