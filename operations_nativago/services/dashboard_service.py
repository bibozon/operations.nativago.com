from operations_nativago.models.dashboard import DashboardMetrics

class DashboardService:
    def get_metrics(self):
        # Lógica para obtener métricas clave
        return DashboardMetrics(
            total_reservations=0,
            total_income=0.0,
            active_experiences=0,
            registered_users=0
        )
