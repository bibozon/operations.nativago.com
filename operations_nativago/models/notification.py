from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationType(str):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    COMMUNICATION = "communication"

class Notification(BaseModel):
    id: int
    sender_id: int
    receiver_id: Optional[int]
    message: str
    type: NotificationType
    created_at: datetime
    read: bool

class NotificationCreate(BaseModel):
    sender_id: int
    receiver_id: Optional[int]
    message: str
    type: NotificationType

class NotificationUpdate(BaseModel):
    read: Optional[bool]
