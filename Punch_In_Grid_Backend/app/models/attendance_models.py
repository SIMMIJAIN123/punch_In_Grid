from pydantic import BaseModel
from datetime import datetime
from typing import Optional

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

class CheckInRequest(BaseModel):
    emp_id: str
    name: str
    shift: str

class CheckOutRequest(BaseModel):
    emp_id: str 