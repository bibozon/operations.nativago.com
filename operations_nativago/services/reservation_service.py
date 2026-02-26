from operations_nativago.models.reservation import Reservation, ReservationCreate, ReservationUpdate

class ReservationService:
    def create_reservation(self, reservation_data: ReservationCreate):
        # Lógica para crear reserva
        pass

    def get_reservation(self, reservation_id: int):
        # Lógica para obtener reserva
        pass

    def update_reservation(self, reservation_id: int, reservation_data: ReservationUpdate):
        # Lógica para actualizar reserva
        pass

    def cancel_reservation(self, reservation_id: int):
        # Lógica para cancelar reserva
        pass
