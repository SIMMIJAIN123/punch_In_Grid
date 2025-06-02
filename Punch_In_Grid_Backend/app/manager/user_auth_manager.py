# THis is Bridge between router (user-auth.py) and services (user_auth_services.py)
from pydantic import BaseModel, EmailStr, Field
import pandas as pd
from app.services.user_auth_services import AuthUserService
from app.models.user_auth_models import (
    RegisterRequest, LoginRequest, SetPasswordRequest,
    UserResponse, LoginSuccessResponse, TokenData
)
from datetime import datetime
import pytz

class AuthUserManager:
    def __init__(self):
        self.service = AuthUserService()
        self.ist_timezone = pytz.timezone('Asia/Kolkata')

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

        if user.get("role") != "admin" and user.get("is_active") == "false":
            return None, "First you need to set your password"
        

        if not self.service.verify_password(login_req.password, user["password"]):
            return None, "Invalid email or password"
        
        if user.get("role") == "admin":
            user["is_active"]= "true"

        return user, None

    def bulk_register_from_excel(self, file):
        df = pd.read_excel(file)
        users = df.to_dict(orient="records")  # converts DataFrame to list of dicts
        return self.service.bulk_register_users(users)

    def set_password(self, set_pass_req: SetPasswordRequest):
        return self.service.set_user_password(set_pass_req.email, set_pass_req.password)

    def get_logged_in_users(self):
        return self.service.get_logged_in_users()

    def update_user_email_by_admin(self, emp_id: str, new_email: str):
        return self.service.update_user_email_by_admin(emp_id, new_email)
    
    def fetch_attendance_by_empcode(self, empcode: str):
        return self.service.fetch_attendance_by_empcode(empcode)
    
    # def parse_and_store_attendance(self, text: str):
    #     return self.service.parse_and_store_attendance(text)

    def fetch_attendance_by_date_range(self, start_date: str, end_date: str, name: str = None):
        return self.service.fetch_attendance_by_date_range(start_date, end_date, name)
    
    def fetch_all_attendance_data(self):
        return self.service.fetch_all_attendance_data()

    def bulk_index_attendance(self, records):
        return self.service.bulk_index_attendance(records)

    def get_user_by_id(self, emp_id: str):
        return self.service.get_user_by_id(emp_id)

    def _convert_to_ist(self, time_str):
        """Convert time string to IST datetime"""
        try:
            # Parse the time string to datetime
            current_time = datetime.strptime(time_str, "%I:%M %p")
            
            # Get current date
            now = datetime.now(self.ist_timezone)
            
            # Combine current date with time
            current_datetime = now.replace(
                hour=current_time.hour,
                minute=current_time.minute,
                second=0,
                microsecond=0
            )
            
            return current_datetime
        except Exception as e:
            print(f"Error converting to IST: {str(e)}")
            return None

    def _parse_time(self, time_str):
        """Convert time string to IST datetime"""
        try:
            # First convert to datetime
            time_obj = datetime.strptime(time_str, "%I:%M %p")
            
            # Get current date in IST
            now = datetime.now(self.ist_timezone)
            
            # Combine current date with time
            ist_time = now.replace(
                hour=time_obj.hour,
                minute=time_obj.minute,
                second=0,
                microsecond=0
            )
            
            return ist_time
        except:
            return None

    def _calculate_time_diff(self, time1, time2):
        """Calculate difference between two times in minutes"""
        if not time1 or not time2:
            return 0
            
        # Ensure both times are in IST
        if not isinstance(time1, datetime):
            time1 = self._parse_time(str(time1))
        if not isinstance(time2, datetime):
            time2 = self._parse_time(str(time2))
            
        if not time1 or not time2:
            return 0
            
        # Handle overnight shifts
        if time2 < time1:
            time2 = time2.replace(day=time2.day + 1)
            
        diff = (time2 - time1).total_seconds() / 60
        return int(diff)

    def record_check_in(self, emp_id: str, name: str, check_in_time: str, date: str):
        try:
            # Get user details including shift
            user = self.service.get_user_by_id(emp_id)
            if not user:
                return "User not found"

            shift = user.get("shift", "4")  # Default to shift 4 if not set
            
            # Get shift timings from shifts index
            shift_timings = self.service.get_shift_timings(shift)
            
            # Convert check-in time to IST
            current_time_obj = self._convert_to_ist(check_in_time)
            shift_in_time = self._parse_time(shift_timings["shift_intime"])
            
            if not current_time_obj or not shift_in_time:
                return "Invalid time format"
            
            # Calculate late_in in IST
            late_in = 0
            if current_time_obj > shift_in_time:
                late_in = self._calculate_time_diff(shift_in_time, current_time_obj)

            # Format time for storage
            ist_time = current_time_obj.strftime("%I:%M %p")
            ist_date = current_time_obj.strftime("%Y-%m-%d")

            attendance_record = {
                "emp_id": emp_id,
                "name": name,
                "date": ist_date,
                "intime": ist_time,
                "shift": shift,
                "status": "Present",
                "timestamp_in": current_time_obj.isoformat(),
                "late_in": str(late_in),
                "shift_intime": shift_timings["shift_intime"],
                "shift_outtime": shift_timings["shift_outtime"]
            }

            result = self.service.record_attendance(attendance_record)
            if isinstance(result, str):
                return result
            return attendance_record
        except Exception as e:
            print(f"Error in record_check_in: {str(e)}")
            return str(e)

    def record_check_out(self, emp_id: str, check_out_time: str, date: str):
        try:
            # Get current attendance record
            current_record = self.service.get_attendance_by_date(emp_id, date)
            if not current_record:
                return "No check-in record found for today"

            if current_record.get("outtime"):
                return "Already checked out for today"

            # Get shift timings
            shift_timings = self.service.get_shift_timings(current_record["shift"])

            # Convert check-out time to IST
            current_time_obj = self._convert_to_ist(check_out_time)
            shift_out_time = self._parse_time(shift_timings["shift_outtime"])
            
            if not current_time_obj or not shift_out_time:
                return "Invalid time format"

            # For overnight shifts, adjust shift_out_time if needed
            if shift_out_time < self._parse_time(current_record["intime"]):
                shift_out_time = shift_out_time.replace(day=shift_out_time.day + 1)

            # Calculate early_out and overtime in IST
            early_out = 0
            overtime = 0
            if current_time_obj < shift_out_time:
                early_out = self._calculate_time_diff(current_time_obj, shift_out_time)
            elif current_time_obj > shift_out_time:
                overtime = self._calculate_time_diff(shift_out_time, current_time_obj)

            # Format time for storage
            ist_time = current_time_obj.strftime("%I:%M %p")

            update_data = {
                "outtime": ist_time,
                "timestamp_out": current_time_obj.isoformat(),
                "early_out": str(early_out),
                "overtime": str(overtime),
                "work_ot": str(overtime)
            }

            result = self.service.update_attendance(emp_id, date, update_data)
            if isinstance(result, str):
                return result
            return result
        except Exception as e:
            print(f"Error in record_check_out: {str(e)}")
            return str(e)

    def get_attendance_by_date(self, emp_id: str, date: str):
        return self.service.get_attendance_by_date(emp_id, date)

auth_user_manager = AuthUserManager()
