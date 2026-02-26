from fastapi import APIRouter, HTTPException
from operations_nativago.models.user import User, UserCreate, UserUpdate
from operations_nativago.services.user_service import UserService

router = APIRouter()

@router.post("/", response_model=User)
def create_user(user: UserCreate):
    service = UserService()
    return service.create_user(user)

@router.get("/{user_id}", response_model=User)
def get_user(user_id: int):
    service = UserService()
    return service.get_user(user_id)

@router.put("/{user_id}", response_model=User)
def update_user(user_id: int, user: UserUpdate):
    service = UserService()
    return service.update_user(user_id, user)

@router.delete("/{user_id}")
def delete_user(user_id: int):
    service = UserService()
    return service.delete_user(user_id)
