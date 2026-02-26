from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AuditAction(str):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    APPROVE = "approve"
    REJECT = "reject"
    PAYMENT = "payment"

class AuditLog(BaseModel):
    id: int
    user_id: int
    action: AuditAction
    target_id: Optional[int]
    target_type: Optional[str]
    timestamp: datetime
    details: Optional[str]

class AuditLogCreate(BaseModel):
    user_id: int
    action: AuditAction
    target_id: Optional[int]
    target_type: Optional[str]
    details: Optional[str]
