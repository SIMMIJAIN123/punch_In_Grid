
from pydantic import BaseModel, EmailStr, Field
import pandas as pd
from app.services.user_auth_services import AuthUserService
from app.models.user_auth_models import (
    RegisterRequest, LoginRequest, SetPasswordRequest,
    UserResponse, LoginSuccessResponse, TokenData
)

class AuthUserManager:
    def __init__(self):
        self.service = AuthUserService()

    def register(self, user_req: RegisterRequest):
        user_data = user_req.dict()
        registered_user, error = self.service.register_user(user_data)
        if error:
            return None, error
        return registered_user, None

    def login(self, login_req: LoginRequest):
        user = self.service.get_user_by_email(login_req.email)
        if not user:
            return None, "Invalid email or password"

        if user.get("is_active") == "false":
            return None, "First you need to set your password"

        if not self.service.verify_password(login_req.password, user["password"]):
            return None, "Invalid email or password"

        return user, None

    def bulk_register_from_excel(self, file):
        df = pd.read_excel(file)
        users = df.to_dict(orient="records")
        return self.service.bulk_register_users(users)

    def set_password(self, set_pass_req: SetPasswordRequest):
        return self.service.set_user_password(set_pass_req.email, set_pass_req.password)

    def get_logged_in_users(self):
        return self.service.get_logged_in_users()

    def update_user_email_by_admin(self, emp_id: str, new_email: str):
        return self.service.update_user_email_by_admin(emp_id, new_email)
    
    def fetch_attendance_by_empcode(self, empcode: str):
        return self.service.fetch_attendance_by_empcode(empcode)
    
    def parse_and_store_attendance(self, text: str):
        return self.service.parse_and_store_attendance(text)

    def fetch_attendance_by_date_range(self, start_date: str, end_date: str, name: str = None):
        return self.service.fetch_attendance_by_date_range(start_date, end_date, name)
    
    def fetch_all_attendance_data(self):
        return self.service.fetch_all_attendance_data()

    def bulk_index_attendance(self, records):
        return self.service.bulk_index_attendance(records)

auth_user_manager = AuthUserManager()
