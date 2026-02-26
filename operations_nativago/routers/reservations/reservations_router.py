from fastapi import APIRouter, HTTPException, Depends
from operations-nativago.services.role_service import RoleService
def require_operations_role(user_role: str = "operations"):
	if not RoleService.has_role(user_role, ["operations", "admin"]):
		raise HTTPException(status_code=403, detail="No autorizado")
from operations-nativago.models.reservation import Reservation, ReservationCreate, ReservationUpdate
from operations-nativago.services.reservation_service import ReservationService

router = APIRouter()

@router.post("/", response_model=Reservation)
def create_reservation(reservation: ReservationCreate, user_role: str = Depends(require_operations_role)):
	service = ReservationService()
	return service.create_reservation(reservation)

@router.get("/{reservation_id}", response_model=Reservation)
def get_reservation(reservation_id: int):
	service = ReservationService()
	return service.get_reservation(reservation_id)

@router.put("/{reservation_id}", response_model=Reservation)
def update_reservation(reservation_id: int, reservation: ReservationUpdate):
	service = ReservationService()
	return service.update_reservation(reservation_id, reservation)

@router.delete("/{reservation_id}")
def cancel_reservation(reservation_id: int):
	service = ReservationService()
	return service.cancel_reservation(reservation_id)
