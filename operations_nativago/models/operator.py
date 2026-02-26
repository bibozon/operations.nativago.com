from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class OperatorStatus(str):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    REJECTED = "rejected"
    APPROVED = "approved"

class Operator(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    status: OperatorStatus
    created_at: datetime
    updated_at: Optional[datetime]
    performance_score: Optional[float]

class OperatorCreate(BaseModel):
    name: str
    email: str
    phone: str

class OperatorUpdate(BaseModel):
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    status: Optional[OperatorStatus]
    performance_score: Optional[float]
