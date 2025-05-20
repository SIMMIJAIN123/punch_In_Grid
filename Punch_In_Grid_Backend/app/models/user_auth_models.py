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

class SetPasswordRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    emp_id: str
    name: str
    role: str
    email: EmailStr
    is_active: bool

class LoginSuccessResponse(BaseModel):
    message: str
    emp_id: str
    email: str
    role: str
    is_active: bool
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str
    role: str
    emp_id: str