from typing import List
from operations_nativago.models.user import UserRole

class RoleService:
    @staticmethod
    def has_role(user_role: str, allowed_roles: List[str]) -> bool:
        return user_role in allowed_roles
