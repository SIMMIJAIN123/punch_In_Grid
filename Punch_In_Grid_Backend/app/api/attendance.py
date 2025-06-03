from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime, time
from app.api.user_auth import get_current_user

router = APIRouter()

# In-memory storage for attendance data (replace with database in production)
attendance_records: Dict[str, dict] = {}

class ShiftCreate(BaseModel):
    shift_name: str
    shift_intime: str
    shift_outtime: str

class CheckIn(BaseModel):
    emp_id: str
    name: str
    shift: str

class CheckOut(BaseModel):
    emp_id: str

@router.post("/api/attendance/shifts")
async def create_shift(shift: ShiftCreate, current_user: dict = Depends(get_current_user)):
    try:
        # Logic to create a shift
        return {"message": "Shift created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/attendance/check-in")
async def check_in(check_in_data: CheckIn, current_user: dict = Depends(get_current_user)):
    try:
        current_time = datetime.now()
        attendance_record = {
            "emp_id": check_in_data.emp_id,
            "name": check_in_data.name,
            "shift": check_in_data.shift,
            "intime": current_time.strftime("%I:%M %p"),
            "outtime": None,
            "status": "Checked In",
            "date": current_time.date().isoformat(),
            "late_in": 0,  # Calculate this based on shift timing
            "early_out": 0,
            "overtime": 0
        }
        
        # Store the attendance record
        attendance_records[check_in_data.emp_id] = attendance_record
        
        return attendance_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/attendance/check-out")
async def check_out(check_out_data: CheckOut, current_user: dict = Depends(get_current_user)):
    try:
        if check_out_data.emp_id not in attendance_records:
            raise HTTPException(status_code=404, detail="No check-in record found")
            
        current_time = datetime.now()
        attendance_record = attendance_records[check_out_data.emp_id]
        attendance_record.update({
            "outtime": current_time.strftime("%I:%M %p"),
            "status": "Checked Out"
        })
        
        return attendance_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/attendance/today/{emp_id}")
async def get_today_attendance(emp_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Check if there's an attendance record for today
        if emp_id in attendance_records:
            return attendance_records[emp_id]
            
        # Return default record if no attendance found
        return {
            "emp_id": emp_id,
            "date": datetime.now().date().isoformat(),
            "intime": None,
            "outtime": None,
            "status": "Not Checked In",
            "late_in": None,
            "early_out": None,
            "overtime": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 