from fastapi import APIRouter, HTTPException
from operations-nativago.models.notification import Notification, NotificationCreate, NotificationUpdate
from operations-nativago.services.notification_service import NotificationService

router = APIRouter()

@router.post("/", response_model=Notification)
def send_notification(notification: NotificationCreate):
	service = NotificationService()
	return service.send_notification(notification)

@router.get("/{notification_id}", response_model=Notification)
def get_notification(notification_id: int):
	service = NotificationService()
	return service.get_notification(notification_id)

@router.put("/{notification_id}/read", response_model=Notification)
def mark_as_read(notification_id: int):
	service = NotificationService()
	return service.mark_as_read(notification_id)
