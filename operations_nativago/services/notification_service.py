from operations_nativago.models.notification import Notification, NotificationCreate, NotificationUpdate

class NotificationService:
    def send_notification(self, notification_data: NotificationCreate):
        # Lógica para enviar notificación
        pass

    def get_notification(self, notification_id: int):
        # Lógica para obtener notificación
        pass

    def mark_as_read(self, notification_id: int):
        # Lógica para marcar como leída
        pass
