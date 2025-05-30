# pydantic used here to check data get from the user is in right format or not
# If someone gives an invalid email, it will automatically show an error.
from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    emp_id: str
    name: str
    role: str = Field(..., pattern="^(admin)$")
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# This is used when a user sets a new password for the first time.
class SetPasswordRequest(BaseModel):
    email: EmailStr
    password: str

# This is the format of data that will be sent back to the user.
class UserResponse(BaseModel):
    emp_id: str
    name: str
    role: str
    email: EmailStr
    is_active: bool

class LoginSuccessResponse(BaseModel):
    message: str
    emp_id: str
    name: str
    email: str
    role: str
    is_active: bool
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str
    role: str
    emp_id: str