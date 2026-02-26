from operations-nativago.services.nativago_api_service import NativagoAPIService
@router.get("/external/sync")
def sync_experiences():
	api_service = NativagoAPIService()
	return api_service.get_experiences()
from fastapi import APIRouter, HTTPException
from operations-nativago.models.experience import Experience, ExperienceCreate, ExperienceUpdate
from operations-nativago.services.experience_service import ExperienceService

router = APIRouter()

@router.post("/", response_model=Experience)
def create_experience(experience: ExperienceCreate):
	service = ExperienceService()
	return service.create_experience(experience)

@router.get("/{experience_id}", response_model=Experience)
def get_experience(experience_id: int):
	service = ExperienceService()
	return service.get_experience(experience_id)

@router.put("/{experience_id}", response_model=Experience)
def update_experience(experience_id: int, experience: ExperienceUpdate):
	service = ExperienceService()
	return service.update_experience(experience_id, experience)

@router.post("/{experience_id}/approve", response_model=Experience)
def approve_experience(experience_id: int):
	service = ExperienceService()
	return service.approve_experience(experience_id)

@router.post("/{experience_id}/reject", response_model=Experience)
def reject_experience(experience_id: int):
	service = ExperienceService()
	return service.reject_experience(experience_id)
