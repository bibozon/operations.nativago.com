from fastapi import APIRouter, HTTPException
from operations_nativago.models.finance import Commission, Payment, Report
from operations_nativago.services.finance_service import FinanceService

router = APIRouter()

@router.post("/commission", response_model=Commission)
def create_commission(commission_data):
	service = FinanceService()
	return service.create_commission(commission_data)

@router.post("/payment", response_model=Payment)
def create_payment(payment_data):
	service = FinanceService()
	return service.create_payment(payment_data)

@router.get("/report/{report_id}", response_model=Report)
def get_report(report_id: int):
	service = FinanceService()
	return service.get_report(report_id)
