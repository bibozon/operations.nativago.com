from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from operations_nativago.services.auth_service import AuthService


class LoginRequest(BaseModel):
    email: str
    password: str


router = APIRouter()


# Credenciales de super admin para entorno de desarrollo/demo
SUPER_ADMIN_EMAIL = "superadmin@nativago.com"
SUPER_ADMIN_PASSWORD_HASH = AuthService.get_password_hash("superadmin123")


@router.post("/login")
def login(payload: LoginRequest):
    """Autenticación básica para entorno de desarrollo.

    Actualmente valida solo un usuario super admin fijo y devuelve
    un JWT en el campo `token`, que es lo que espera el frontend.
    """
    if payload.email != SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if not AuthService.verify_password(payload.password, SUPER_ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    access_token = AuthService.create_access_token({"sub": payload.email, "role": "admin"})
    return {"token": access_token}
