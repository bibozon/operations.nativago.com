from operations-nativago.models.experience import Experience, ExperienceCreate, ExperienceUpdate

class ExperienceService:
    def create_experience(self, experience_data: ExperienceCreate):
        # Lógica para crear experiencia
        pass

    def get_experience(self, experience_id: int):
        # Lógica para obtener experiencia
        pass

    def update_experience(self, experience_id: int, experience_data: ExperienceUpdate):
        # Lógica para actualizar experiencia
        pass

    def approve_experience(self, experience_id: int):
        # Lógica para aprobar experiencia
        pass

    def reject_experience(self, experience_id: int):
        # Lógica para rechazar experiencia
        pass
