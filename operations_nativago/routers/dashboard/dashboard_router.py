from fastapi import APIRouter
from operations_nativago.services.dashboard_service import DashboardService
from operations_nativago.models.dashboard import DashboardMetrics

router = APIRouter()

@router.get("/metrics", response_model=DashboardMetrics)
def get_metrics():
	service = DashboardService()
	return service.get_metrics()
