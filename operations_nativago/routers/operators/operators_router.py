from fastapi import APIRouter, HTTPException
from operations-nativago.models.operator import Operator, OperatorCreate, OperatorUpdate
from operations-nativago.services.operator_service import OperatorService

router = APIRouter()

@router.post("/", response_model=Operator)
def create_operator(operator: OperatorCreate):
	service = OperatorService()
	return service.create_operator(operator)

@router.get("/{operator_id}", response_model=Operator)
def get_operator(operator_id: int):
	service = OperatorService()
	return service.get_operator(operator_id)

@router.put("/{operator_id}", response_model=Operator)
def update_operator(operator_id: int, operator: OperatorUpdate):
	service = OperatorService()
	return service.update_operator(operator_id, operator)

@router.post("/{operator_id}/approve", response_model=Operator)
def approve_operator(operator_id: int):
	service = OperatorService()
	return service.approve_operator(operator_id)

@router.post("/{operator_id}/reject", response_model=Operator)
def reject_operator(operator_id: int):
	service = OperatorService()
	return service.reject_operator(operator_id)
