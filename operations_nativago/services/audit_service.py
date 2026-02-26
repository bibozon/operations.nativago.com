from operations-nativago.models.audit import AuditLog, AuditLogCreate

class AuditService:
    def log_action(self, log_data: AuditLogCreate):
        # Lógica para registrar acción
        pass

    def get_logs(self, user_id: int = None):
        # Lógica para obtener logs
        pass
