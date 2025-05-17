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
        user_data["is_active"] = False

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
        user["is_active"] = True

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
    

    def get_logged_in_users(self):
        query = {
            "query": {
                "term": {
                    "is_active": "true"
                }
            }
        }
        resp = self.es.search(index=self.index, body=query, size=10000)
        hits = resp['hits']['hits']
        
        return [
            {
                "emp_id": hit["_source"]["emp_id"],
                "name": hit["_source"]["name"],
                "email": hit["_source"]["email"],
                "role": hit["_source"]["role"],
                "is_active": hit["_source"]["is_active"]
            }
            for hit in hits
        ]



    def update_user_email_by_admin(self, emp_id: str, new_email: str):
        # Search user by emp_id
        try:
            user = self.es.get(index=self.index, id=emp_id)["_source"]
        except:
            return None, "User not found"

        # Check if new email already exists
        if self.get_user_by_email(new_email):
            return None, "Email already exists"

        # Update email
        user["email"] = new_email
        self.es.index(index=self.index, id=emp_id, document=user)
        return user, None



    




