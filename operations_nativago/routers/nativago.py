from fastapi import APIRouter, HTTPException
import requests
import os
from dotenv import load_dotenv

load_dotenv()

NATIVAGO_API_URL = os.getenv("NATIVAGO_API_URL", "https://api.nativago.com/productos")
NATIVAGO_API_KEY = os.getenv("NATIVAGO_API_KEY", "")

router = APIRouter()

@router.get("/")
def get_nativago_products():
    headers = {"Authorization": f"Bearer {NATIVAGO_API_KEY}"}
    try:
        response = requests.get(NATIVAGO_API_URL, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
