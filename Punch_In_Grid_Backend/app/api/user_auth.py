from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from app.manager.user_auth_manager import SetPasswordRequest
from app.manager.user_auth_manager import (
    auth_user_manager, RegisterRequest, LoginRequest, UserResponse, 
    LoginSuccessResponse, TokenData, ShiftRequest
)
from app.utils.jwt_helper import create_access_token, decode_access_token
from datetime import timedelta, datetime
import pytz
# import io
import pandas as pd
from io import BytesIO

router = APIRouter(prefix="/service-auth-powerGrid/v1/endpoint", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/service-auth-powerGrid/v1/endpoint/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_access_token(token)
        return payload
    except Exception:
        return None

@router.post("/register", response_model=UserResponse)
async def register(user_req: RegisterRequest):
    user, error = auth_user_manager.register(user_req)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return user

@router.post("/login", response_model=LoginSuccessResponse)
async def login(login_req: LoginRequest):
    user, error = auth_user_manager.login(login_req)
    if error or not user:
        raise HTTPException(status_code=401, detail=error or "Invalid credentials")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(data={
        "emp_id": user["emp_id"],
        "email": user["email"],
        "role": user["role"],
        "is_active": user["is_active"]
    }, expires_delta=access_token_expires)

    return {
        "message": "Login successful",
        "emp_id": user["emp_id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "is_active": user["is_active"],
        "password_set": user["is_active"] == "true",
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/upload_excel")
async def upload_excel(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    inserted_count = auth_user_manager.bulk_register_from_excel(file.file)
    return {
        "message": "Upload completed",
        "inserted_count": inserted_count
    }

@router.post("/set-password")
async def set_password(set_pass_req: SetPasswordRequest):
    user, error = auth_user_manager.set_password(set_pass_req)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": "Password set successfully. You can now login."}

@router.get("/logged_in_users")
async def get_logged_in_users(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")


    logged_in_users = auth_user_manager.get_logged_in_users()
    return {
        "message": "Logged in users fetched successfully",
        "data": logged_in_users
    }

@router.put("/admin/users/{emp_id}/email")
async def update_user_email(emp_id: str, new_email: str, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    updated_user, error = auth_user_manager.update_user_email_by_admin(emp_id, new_email)
    if error:
        raise HTTPException(status_code=400, detail=error)

    return {
        "message": "Email updated successfully",
        "data": updated_user
    }

@router.get("/attendance_data")
async def get_attendance_data(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    records = auth_user_manager.fetch_all_attendance_data()
    return {
        "message": "Attendance records fetched successfully",
        "data": records
    }

@router.get("/attendance_data/filter")
async def get_attendance_by_date_range(
    start_date: str = None,
    end_date: str = None,
    employee_id: str = None,
    token: str = Depends(oauth2_scheme)
):
    user = get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # If not admin, only allow access to own data
    if user.get("role") != "admin":
        employee_id = user.get("emp_id")

    if not start_date or not end_date:
        raise HTTPException(status_code=400, detail="Both start_date and end_date are required.")

    records = auth_user_manager.fetch_attendance_by_date_range(start_date, end_date, employee_id)
    return {
        "message": "Filtered attendance records",
        "data": records
    }

# @router.get("/attendance_data/{empcode}")
# def get_attendance_by_empcode(empcode: str, token: str = Depends(oauth2_scheme)):
#     user = get_current_user(token)
#     if not user or user.get("role") != "admin":
#         raise HTTPException(status_code=403, detail="Not authorized")

#     records = auth_user_manager.fetch_attendance_by_empcode(empcode)
#     return {
#         "message": f"Attendance for empcode {empcode}",
#         "data": records
#     }

@router.post("/upload_attendance_excel")
async def upload_attendance_excel(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents), engine='openpyxl')
        df.columns = df.columns.astype(str)

        empcode_indices = df[df['Weekly Periodic Report'] == 'Empcode'].index.tolist()
        if not empcode_indices:
            raise HTTPException(status_code=400, detail="No 'Empcode' blocks found in Excel sheet")

        records, inserted_data = [], []

        for idx_num, idx in enumerate(empcode_indices):
            try:
                empcode = str(df.at[idx, 'Unnamed: 1']).strip()
                name = str(df.at[idx, 'Unnamed: 4']).strip()

                header_idx = idx + 1
                data_start = header_idx + 1
                data_end = empcode_indices[idx_num + 1] if idx_num + 1 < len(empcode_indices) else len(df)

                for i in range(data_start, data_end):
                    row = df.iloc[i]
                    if pd.isna(row['Weekly Periodic Report']):
                        continue
                    try:
                        # Safely parse date
                        date_val = pd.to_datetime(row['Weekly Periodic Report'], errors='coerce')
                        if pd.isna(date_val):
                            continue
                        date_str = date_val.strftime('%Y-%m-%d')

                        record = {
                            "empcode": empcode,
                            "name": name,
                            "date": date_str,
                            "shift": str(row.get('Unnamed: 1', '')).strip(),
                            "intime": str(row.get('Unnamed: 2', '')).strip(),
                            "late_in": str(row.get('Unnamed: 3', '')).strip(),
                            "early_out": str(row.get('Unnamed: 4', '')).strip(),
                            "outtime": str(row.get('Unnamed: 5', '')).strip(),
                            "work_ot": str(row.get('01/05/2025 To 15/05/2025', '')).strip(),
                            "overtime": str(row.get('Unnamed: 7', '')).strip(),
                            "status": str(row.get('Unnamed: 8', '')).strip(),
                            "remark": str(row.get('Unnamed: 9', '')).strip()
                        }

                        record = {k: v if v not in ['nan', '--:--', 'NaT'] else '' for k, v in record.items()}
                        doc_id = f"{empcode}_{date_str}_{record['shift']}".replace(" ", "_")

                        records.append({
                            "_index": "attendance_records",
                            "_id": doc_id,
                            "_source": record
                        })
                        inserted_data.append(record)

                    except Exception as row_err:
                        print(f"Row error at line {i}: {row_err}")
                        continue
            except Exception as emp_err:
                print(f"Emp block error at idx {idx}: {emp_err}")
                continue

        if not records:
            raise HTTPException(status_code=400, detail="No valid attendance records found in the Excel file")

        success_count = auth_user_manager.bulk_index_attendance(records)
        return {
            "message": "Excel file processed and attendance data stored successfully",
            "inserted_count": success_count,
            "inserted_data": inserted_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process Excel file: {str(e)}")

@router.post("/attendance/check-in")
async def check_in(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Get current time in IST
        ist = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist)
        current_date = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%I:%M %p")

        # Get user details
        user_details = auth_user_manager.get_user_by_id(user.get("emp_id"))
        if not user_details:
            raise HTTPException(status_code=404, detail="User not found")

        result = auth_user_manager.record_check_in(
            emp_id=user.get("emp_id"),
            name=user_details.get("name", ""),
            check_in_time=current_time,
            date=current_date
        )

        if isinstance(result, str):
            raise HTTPException(status_code=400, detail=result)

        return {
            "message": "Check-in recorded successfully",
            "data": result
        }
    except Exception as e:
        print(f"Error in check_in endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/attendance/check-out")
async def check_out(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Get current time in IST
        ist = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist)
        current_date = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%I:%M %p")

        result = auth_user_manager.record_check_out(
            emp_id=user.get("emp_id"),
            check_out_time=current_time,
            date=current_date
        )

        if isinstance(result, str):
            raise HTTPException(status_code=400, detail=result)

        return {
            "message": "Check-out recorded successfully",
            "data": result
        }
    except Exception as e:
        print(f"Error in check_out endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/attendance/today")
async def get_today_attendance(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Get current date in IST
        ist = pytz.timezone('Asia/Kolkata')
        current_date = datetime.now(ist).strftime("%Y-%m-%d")
        
        attendance = auth_user_manager.get_attendance_by_date(
            emp_id=user.get("emp_id"),
            date=current_date
        )

        if not attendance:
            return {
                "message": "No attendance record found for today",
                "data": None
            }

        return {
            "message": "Today's attendance retrieved successfully",
            "data": attendance
        }
    except Exception as e:
        print(f"Error in get_today_attendance endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Shift Management Endpoints
@router.post("/shifts")
async def create_shift(shift_data: ShiftRequest, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    result, error = auth_user_manager.create_shift(shift_data)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return result

@router.get("/shifts/{shift_name}")
async def get_shift(shift_name: str, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    result, error = auth_user_manager.get_shift(shift_name)
    if error:
        raise HTTPException(status_code=404, detail=error)
    
    return {
        "message": "Shift retrieved successfully",
        "data": result
    }

@router.put("/shifts/{shift_name}")
async def update_shift(shift_name: str, shift_data: ShiftRequest, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    result, error = auth_user_manager.update_shift(shift_name, shift_data.dict())
    if error:
        raise HTTPException(status_code=404 if "not found" in error else 400, detail=error)
    
    return {
        "message": "Shift updated successfully",
        "data": result
    }

@router.delete("/shifts/{shift_name}")
async def delete_shift(shift_name: str, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    result, error = auth_user_manager.delete_shift(shift_name)
    if error:
        raise HTTPException(status_code=404, detail=error)
    
    return {
        "message": "Shift deleted successfully",
        "data": result
    }

@router.get("/shifts")
async def list_shifts(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    result, error = auth_user_manager.list_shifts()
    if error:
        raise HTTPException(status_code=500, detail=str(error))
    
    return {
        "message": "Shifts retrieved successfully",
        "data": result if result else []
    }
