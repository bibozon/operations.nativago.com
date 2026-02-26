from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/")
def list_services():
    # Aquí se listarán los servicios gestionados por los operadores
    return {"services": []}
