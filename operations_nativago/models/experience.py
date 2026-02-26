from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ExperienceStatus(str):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    REJECTED = "rejected"
    APPROVED = "approved"

class Experience(BaseModel):
    id: int
    title: str
    description: str
    location: str
    operator_id: int
    status: ExperienceStatus
    created_at: datetime
    updated_at: Optional[datetime]
    price: float
    commission: float

class ExperienceCreate(BaseModel):
    title: str
    description: str
    location: str
    operator_id: int
    price: float
    commission: float

class ExperienceUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    location: Optional[str]
    status: Optional[ExperienceStatus]
    price: Optional[float]
    commission: Optional[float]
