# pydantic used here to check data get from the user is in right format or not
# If someone gives an invalid email, it will automatically show an error.
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

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

# Shift Management Models
class ShiftRequest(BaseModel):
    shift_name: str = Field(..., description="Name of the shift")
    shift_intime: str = Field(..., description="Shift start time in format HH:MM AM/PM")
    shift_outtime: str = Field(..., description="Shift end time in format HH:MM AM/PM")

class ShiftResponse(BaseModel):
    message: str
    data: dict

class ShiftListResponse(BaseModel):
    message: str
    data: List[dict]

# Attendance Models
class AttendanceRecord(BaseModel):
    emp_id: str
    name: str
    date: str
    intime: Optional[str] = None
    outtime: Optional[str] = None
    shift: str
    status: str = "Present"
    timestamp_in: Optional[datetime] = None
    timestamp_out: Optional[datetime] = None
    late_in: Optional[str] = None
    early_out: Optional[str] = None
    overtime: Optional[str] = None
    work_ot: Optional[str] = None
    shift_intime: Optional[str] = None
    shift_outtime: Optional[str] = None

class CheckInRequest(BaseModel):
    emp_id: str
    name: str
    shift: str

class CheckOutRequest(BaseModel):
    emp_id: str

# Check-in data model
class CheckInData(BaseModel):
    intime: str
    late_in: str
    date: str

# Check-out data model
class CheckOutData(BaseModel):
    outtime: str
    overtime: str
    early_out: str
    date: str

# Response models with message and data
class CheckInResponse(BaseModel):
    message: str = "Check-in recorded successfully"
    data: CheckInData

class CheckOutResponse(BaseModel):
    message: str = "Check-out recorded successfully"
    data: CheckOutData