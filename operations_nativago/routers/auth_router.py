from fastapi import APIRouter, Depends, HTTPException
from operations_nativago.services.auth_service import AuthService
from operations_nativago.models.user import UserCreate

router = APIRouter()

@router.post("/login")
def login(user: UserCreate):
    # Implementar lógica de autenticación
    # ...existing code...
    return {"access_token": "token", "token_type": "bearer"}
