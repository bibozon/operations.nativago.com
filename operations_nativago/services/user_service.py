from operations_nativago.models.user import User, UserCreate, UserUpdate

class UserService:
    def create_user(self, user_data: UserCreate):
        # Lógica para crear usuario
        pass

    def get_user(self, user_id: int):
        # Lógica para obtener usuario
        pass

    def update_user(self, user_id: int, user_data: UserUpdate):
        # Lógica para actualizar usuario
        pass

    def delete_user(self, user_id: int):
        # Lógica para eliminar usuario
        pass
