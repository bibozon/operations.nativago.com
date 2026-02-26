from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class ReservationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    COMPLETED = "completed"

class Reservation(BaseModel):
    id: int
    user_id: int
    experience_id: int
    operator_id: Optional[int]
    status: ReservationStatus
    created_at: datetime
    updated_at: Optional[datetime]
    scheduled_date: datetime
    notes: Optional[str]

class ReservationCreate(BaseModel):
    user_id: int
    experience_id: int
    scheduled_date: datetime
    notes: Optional[str]

class ReservationUpdate(BaseModel):
    status: Optional[ReservationStatus]
    scheduled_date: Optional[datetime]
    notes: Optional[str]
    operator_id: Optional[int]
