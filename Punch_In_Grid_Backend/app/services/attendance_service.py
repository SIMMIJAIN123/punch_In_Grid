from datetime import datetime, timedelta
from app.models.attendance_models import AttendanceRecord, CheckInRequest, CheckOutRequest
from app.database.mongodb import get_database

class AttendanceService:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db["attendance"]

    def _parse_time(self, time_str):
        """Convert time string (e.g. '5:30 PM') to datetime object"""
        try:
            return datetime.strptime(time_str, "%I:%M %p")
        except:
            return None

    def _calculate_time_diff(self, time1, time2):
        """Calculate difference between two times in minutes"""
        if not time1 or not time2:
            return 0
        diff = (time2 - time1).total_seconds() / 60
        return int(diff)

    def _get_shift_times(self, shift):
        """Get shift timings based on shift number"""
        shifts = {
            "4": {
                "intime": "5:30 PM",
                "outtime": "2:30 AM"
            }
        }
        return shifts.get(shift, {"intime": None, "outtime": None})

    async def check_in(self, request: CheckInRequest):
        now = datetime.now()
        current_date = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%I:%M %p")
        
        # Get shift timings
        shift_times = self._get_shift_times(request.shift)
        shift_in_time = self._parse_time(shift_times["intime"])
        
        # Calculate late_in
        current_time_obj = self._parse_time(current_time)
        late_in = 0
        if shift_in_time and current_time_obj:
            if current_time_obj > shift_in_time:
                late_in = self._calculate_time_diff(shift_in_time, current_time_obj)
        
        attendance_record = {
            "emp_id": request.emp_id,
            "name": request.name,
            "date": current_date,
            "intime": current_time,
            "shift": request.shift,
            "status": "Present",
            "timestamp_in": now,
            "late_in": late_in,
            "shift_intime": shift_times["intime"],
            "shift_outtime": shift_times["outtime"]
        }
        
        # Check if record already exists for today
        existing = await self.collection.find_one({
            "emp_id": request.emp_id,
            "date": current_date
        })
        
        if existing:
            if existing.get("intime"):
                return None, "Already checked in for today"
            
            # Update existing record
            await self.collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "intime": current_time,
                    "timestamp_in": now,
                    "late_in": late_in
                }}
            )
            return attendance_record, None
            
        # Create new record
        await self.collection.insert_one(attendance_record)
        return attendance_record, None

    async def check_out(self, request: CheckOutRequest):
        now = datetime.now()
        current_date = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%I:%M %p")
        
        # Find today's record
        record = await self.collection.find_one({
            "emp_id": request.emp_id,
            "date": current_date
        })
        
        if not record:
            return None, "No check-in record found for today"
            
        if record.get("outtime"):
            return None, "Already checked out for today"

        # Calculate early_out and overtime
        shift_times = self._get_shift_times(record["shift"])
        shift_out_time = self._parse_time(shift_times["outtime"])
        current_time_obj = self._parse_time(current_time)
        
        early_out = 0
        overtime = 0
        if shift_out_time and current_time_obj:
            if current_time_obj < shift_out_time:
                early_out = self._calculate_time_diff(current_time_obj, shift_out_time)
            elif current_time_obj > shift_out_time:
                overtime = self._calculate_time_diff(shift_out_time, current_time_obj)
            
        # Update record with checkout time
        await self.collection.update_one(
            {"_id": record["_id"]},
            {"$set": {
                "outtime": current_time,
                "timestamp_out": now,
                "early_out": early_out,
                "overtime": overtime
            }}
        )
        
        record.update({
            "outtime": current_time,
            "timestamp_out": now,
            "early_out": early_out,
            "overtime": overtime
        })
        return record, None

    async def get_today_attendance(self, emp_id: str):
        current_date = datetime.now().strftime("%Y-%m-%d")
        record = await self.collection.find_one({
            "emp_id": emp_id,
            "date": current_date
        })
        return record

    async def get_attendance_by_date_range(self, emp_id: str, start_date: str, end_date: str):
        records = await self.collection.find({
            "emp_id": emp_id,
            "date": {
                "$gte": start_date,
                "$lte": end_date
            }
        }).to_list(length=None)
        return records

attendance_service = AttendanceService() 