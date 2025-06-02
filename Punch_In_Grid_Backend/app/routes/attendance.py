from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional
from elasticsearch import AsyncElasticsearch
import pytz
from ..utils.jwt_helper import decode_access_token

router = APIRouter()

# Initialize Elasticsearch client
es = AsyncElasticsearch(
    hosts=['http://localhost:9200'],
    basic_auth=('elastic', 'your_password')  # Update with your credentials
)

def calculate_attendance_metrics(intime: str, outtime: Optional[str], shift_intime: str, shift_outtime: str):
    # Convert string times to datetime objects
    in_dt = datetime.strptime(intime, "%H:%M")
    shift_in_dt = datetime.strptime(shift_intime, "%H:%M")
    
    # Calculate late in
    late_in = None
    if in_dt > shift_in_dt:
        late_in = str((in_dt - shift_in_dt).seconds // 60)
    
    # Calculate early out and overtime if checked out
    early_out = None
    overtime = None
    if outtime:
        out_dt = datetime.strptime(outtime, "%H:%M")
        shift_out_dt = datetime.strptime(shift_outtime, "%H:%M")
        
        if out_dt < shift_out_dt:
            early_out = str((shift_out_dt - out_dt).seconds // 60)
        elif out_dt > shift_out_dt:
            overtime = str((out_dt - shift_out_dt).seconds // 60)
    
    return {
        "late_in": late_in,
        "early_out": early_out,
        "overtime": overtime
    }

@router.post("/check-in")
async def check_in(data: dict):
    try:
        # Get user's shift details
        shift_resp = await es.get(index="shifts", id=data["shift"])
        shift_data = shift_resp["_source"]
        
        # Get current time in HH:MM format
        current_time = datetime.now(pytz.UTC).strftime("%H:%M")
        today_date = datetime.now(pytz.UTC).strftime("%Y-%m-%d")
        
        # Calculate metrics
        metrics = calculate_attendance_metrics(
            current_time,
            None,
            shift_data["shift_intime"],
            shift_data["shift_outtime"]
        )
        
        # Create attendance record
        attendance_data = {
            "empcode": data["emp_id"],
            "name": data["name"],
            "date": today_date,
            "shift": data["shift"],
            "intime": current_time,
            "late_in": metrics["late_in"],
            "status": "Present",
            "outtime": None,
            "early_out": None,
            "overtime": None
        }
        
        # Store in Elasticsearch
        await es.index(
            index="attendance_records_all",
            id=f"{data['emp_id']}_{today_date}",
            document=attendance_data
        )
        
        return {"message": "Check-in successful", "data": attendance_data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-out")
async def check_out(data: dict):
    try:
        today_date = datetime.now(pytz.UTC).strftime("%Y-%m-%d")
        current_time = datetime.now(pytz.UTC).strftime("%H:%M")
        
        # Get existing attendance record
        record_id = f"{data['emp_id']}_{today_date}"
        attendance = await es.get(index="attendance_records_all", id=record_id)
        attendance_data = attendance["_source"]
        
        # Get shift details
        shift_resp = await es.get(index="shifts", id=attendance_data["shift"])
        shift_data = shift_resp["_source"]
        
        # Calculate metrics
        metrics = calculate_attendance_metrics(
            attendance_data["intime"],
            current_time,
            shift_data["shift_intime"],
            shift_data["shift_outtime"]
        )
        
        # Update attendance record
        attendance_data.update({
            "outtime": current_time,
            "early_out": metrics["early_out"],
            "overtime": metrics["overtime"]
        })
        
        # Store updated record
        await es.index(
            index="attendance_records_all",
            id=record_id,
            document=attendance_data
        )
        
        return {"message": "Check-out successful", "data": attendance_data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/today/{emp_id}")
async def get_today_attendance(emp_id: str):
    try:
        today_date = datetime.now(pytz.UTC).strftime("%Y-%m-%d")
        record_id = f"{emp_id}_{today_date}"
        
        try:
            attendance = await es.get(index="attendance_records_all", id=record_id)
            return attendance["_source"]
        except:
            return None
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/shifts")
async def create_or_update_shift(data: dict):
    try:
        # Validate time format
        try:
            datetime.strptime(data["shift_intime"], "%I:%M %p")
            datetime.strptime(data["shift_outtime"], "%I:%M %p")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid time format. Use format like '5:30 PM'")

        # Convert 12-hour format to 24-hour format for internal use
        intime = datetime.strptime(data["shift_intime"], "%I:%M %p").strftime("%H:%M")
        outtime = datetime.strptime(data["shift_outtime"], "%I:%M %p").strftime("%H:%M")
        
        shift_data = {
            "shift_name": data["shift_name"],
            "shift_intime": intime,
            "shift_outtime": outtime
        }
        
        await es.index(
            index="shifts",
            id=data["shift_name"],
            document=shift_data
        )
        
        return {"message": "Shift created/updated successfully", "data": shift_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 