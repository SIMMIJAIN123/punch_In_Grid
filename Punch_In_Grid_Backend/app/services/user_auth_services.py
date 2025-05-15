from elasticsearch import Elasticsearch
from app.config.setting import settings
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthUserService:
    def __init__(self):
        self.es = Elasticsearch(settings.elasticsearch_url)
        self.index = settings.index_name

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain_password, hashed_password) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def get_user_by_email(self, email: str):
        query = {
            "query": {
                "term": {"email": email}
            }
        }
        resp = self.es.search(index=self.index, body=query)
        hits = resp['hits']['hits']
        if hits:
            return hits[0]['_source']
        return None

    def register_user(self, user_data: dict):
        if self.get_user_by_email(user_data["email"]):
            return None, "User already exists"

        user_data["password"] = self.hash_password(user_data["password"])
        user_data["is_active"] = "true"

        self.es.index(index=self.index, id=user_data["emp_id"], document=user_data)
        return user_data, None

    def authenticate_user(self, email: str, password: str):
        user = self.get_user_by_email(email)
        if not user:
            return None
        if user["is_active"] != "true":
            return None
        if not self.verify_password(password, user["password"]):
            return None
        return user

    def set_user_password(self, email: str, password: str):
        user = self.get_user_by_email(email)
        if not user:
            return None, "User not found"
        if user.get("is_active") == "true":
            return None, "Password already set"

        user["password"] = self.hash_password(password)
        user["is_active"] = "true"

        self.es.index(index=self.index, id=user["emp_id"], document=user)
        return user, None

    def bulk_register_users(self, users: list):
        inserted = 0
        for user in users:
            if not self.get_user_by_email(user["email"]):
                user["emp_id"] = user.get("emp_id", str(uuid.uuid4())[:8])
                user["role"] = "user"
                user["is_active"] = "false"
                user["password"] = None
                self.es.index(index=self.index, id=user["emp_id"], document=user)
                inserted += 1
        return inserted
