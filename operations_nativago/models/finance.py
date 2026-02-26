from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PaymentStatus(str):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"

class Commission(BaseModel):
    id: int
    experience_id: int
    amount: float
    created_at: datetime

class Payment(BaseModel):
    id: int
    reservation_id: int
    amount: float
    status: PaymentStatus
    created_at: datetime
    paid_at: Optional[datetime]

class Report(BaseModel):
    id: int
    generated_at: datetime
    file_url: str
