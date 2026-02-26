from fastapi import APIRouter, HTTPException
from operations_nativago.models.audit import AuditLog, AuditLogCreate
from operations_nativago.services.audit_service import AuditService

router = APIRouter()

@router.post("/log", response_model=AuditLog)
def log_action(log_data: AuditLogCreate):
	service = AuditService()
	return service.log_action(log_data)

@router.get("/logs/{user_id}", response_model=list[AuditLog])
def get_logs(user_id: int):
	service = AuditService()
	return service.get_logs(user_id)
