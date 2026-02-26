import requests

class NativagoAPIService:
    BASE_URL = "https://api.nativago.com"

    def get_experiences(self):
        response = requests.get(f"{self.BASE_URL}/experiences")
        return response.json()

    def get_users(self):
        response = requests.get(f"{self.BASE_URL}/users")
        return response.json()

    # Agrega métodos según endpoints externos necesarios
