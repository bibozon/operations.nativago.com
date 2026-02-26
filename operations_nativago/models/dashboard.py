from pydantic import BaseModel
from typing import Optional

class DashboardMetrics(BaseModel):
    total_reservations: int
    total_income: float
    active_experiences: int
    registered_users: int
    pending_experiences: Optional[int]
    cancelled_reservations: Optional[int]
    partners_count: Optional[int]
