
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from app.manager.user_auth_manager import SetPasswordRequest
from app.manager.user_auth_manager import (
    auth_user_manager, RegisterRequest, LoginRequest, UserResponse, 
    LoginSuccessResponse, TokenData
)
from app.utils.jwt_helper import create_access_token, decode_access_token
from datetime import timedelta

import pdfplumber  
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
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
def register(user_req: RegisterRequest):
    user, error = auth_user_manager.register(user_req)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return user

@router.post("/login", response_model=LoginSuccessResponse)
def login(login_req: LoginRequest):
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
        "email": user["email"],
        "role": user["role"],
        "is_active": user["is_active"],
        "password_set": user["is_active"] == "true",  # Add this line
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/upload_excel")
def upload_excel(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    inserted_count = auth_user_manager.bulk_register_from_excel(file.file)
    return {
        "message": "Upload completed",
        "inserted_count": inserted_count
    }

@router.post("/set-password")
def set_password(set_pass_req: SetPasswordRequest):
    user, error = auth_user_manager.set_password(set_pass_req)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": "Password set successfully. You can now login."}

@router.get("/logged_in_users")
def get_logged_in_users(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    logged_in_users = auth_user_manager.get_logged_in_users()
    return {
        "message": "Logged in users fetched successfully",
        "data": logged_in_users
    }

@router.put("/admin/users/{emp_id}/email")
def update_user_email(emp_id: str, new_email: str, token: str = Depends(oauth2_scheme)):
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

# @router.post("/upload_attendance_pdf")
# def upload_attendance_pdf(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
#     user = get_current_user(token)
#     if not user or user.get("role") != "admin":
#         raise HTTPException(status_code=403, detail="Not authorized")

#     content = file.file.read()
#     text = ""
#     with pdfplumber.open(io.BytesIO(content)) as pdf:
#         for page in pdf.pages:
#             extracted = page.extract_text()
#             if extracted:
#                 text += extracted + "\n"

#     # DEBUG LINES
#     print("===== DEBUG PDF CONTENT =====")
#     for line in text.splitlines():
#         print(repr(line))
#     print("===== END DEBUG =====")

#     inserted_count = auth_user_manager.parse_and_store_attendance(text)

#     return {
#         "message": "PDF parsed and attendance data stored",
#         "inserted_count": inserted_count
#     }

@router.get("/attendance_data")
def get_attendance_data(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    records = auth_user_manager.fetch_all_attendance_data()
    return {
        "message": "Attendance records fetched successfully",
        "data": records
    }

@router.get("/attendance_data/filter")
def get_attendance_by_date_range(
    start_date: str,
    end_date: str,
    name: str = None,
    token: str = Depends(oauth2_scheme)
):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    records = auth_user_manager.fetch_attendance_by_date_range(start_date, end_date, name)
    return {
        "message": "Filtered attendance records",
        "data": records
    }

@router.get("/attendance_data/{empcode}")
def get_attendance_by_empcode(empcode: str, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    records = auth_user_manager.fetch_attendance_by_empcode(empcode)
    return {
        "message": f"Attendance for empcode {empcode}",
        "data": records
    }

# @router.post("/upload_attendance_excel")
# async def upload_attendance_excel(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
#     # Check admin authorization
#     user = get_current_user(token)
#     if not user or user.get("role") != "admin":
#         raise HTTPException(status_code=403, detail="Not authorized")

#     if not file.filename.endswith(('.xlsx', '.xls')):
#         raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")
    
#     try:
#         contents = await file.read()
#         df = pd.read_excel(BytesIO(contents), engine='openpyxl')
        
#         # Find the employee info row (contains 'Empcode')
#         emp_info_idx = df[df['Weekly Periodic Report'] == 'Empcode'].index[0]
#         emp_info = df.iloc[emp_info_idx]
        
#         # Get employee details
#         empcode = str(emp_info['Unnamed: 1'])
#         name = str(emp_info['Unnamed: 4'])
        
#         # Get the header row (contains column names)
#         header_idx = emp_info_idx + 1
        
#         # Get actual attendance data (starts after header row)
#         data = df.iloc[header_idx + 1:].copy()
        
#         # Prepare records for Elasticsearch
#         records = []
#         for _, row in data.iterrows():
#             # Skip if no date (empty row)
#             if pd.isna(row['Weekly Periodic Report']):
#                 continue
            
#             try:
#                 # Convert date to required format
#                 date_val = pd.to_datetime(row['Weekly Periodic Report'])
#                 date_str = date_val.strftime('%Y-%m-%d')
                
#                 record = {
#                     "empcode": empcode,
#                     "name": name,
#                     "date": date_str,
#                     "shift": str(row['Unnamed: 1']),
#                     "intime": str(row['Unnamed: 2']),
#                     "late_in": str(row['Unnamed: 3']),
#                     "early_out": str(row['Unnamed: 4']),
#                     "outtime": str(row['Unnamed: 5']),
#                     "work_ot": str(row['01/05/2025 To 15/05/2025']),
#                     "overtime": str(row['Unnamed: 7']),
#                     "status": str(row['Unnamed: 8']),
#                     "remark": str(row['Unnamed: 9'] if not pd.isna(row['Unnamed: 9']) else '')
#                 }
                
#                 # Clean the data
#                 record = {k: v if v not in ['nan', '--:--', 'NaT'] else '' for k, v in record.items()}
                
#                 # Generate unique document ID
#                 doc_id = f"{empcode}_{date_str}_{record['shift']}"
                
#                 records.append({
#                     "_index": "attendance_records",
#                     "_id": doc_id,
#                     "_source": record
#                 })
#             except Exception as e:
#                 continue  # Skip invalid rows
        
#         if not records:
#             raise HTTPException(status_code=400, detail="No valid attendance records found in the Excel file")
        
#         # Bulk index into Elasticsearch
#         try:
#             success_count = auth_user_manager.bulk_index_attendance(records)
#             return {
#                 "message": "Excel file processed and attendance data stored successfully",
#                 "inserted_count": success_count
#             }
#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"Failed to store attendance records: {str(e)}")
            
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to process Excel file: {str(e)}")

# @router.post("/upload_attendance_excel")
# async def upload_attendance_excel(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
#     # Check admin authorization
#     user = get_current_user(token)
#     if not user or user.get("role") != "admin":
#         raise HTTPException(status_code=403, detail="Not authorized")

#     if not file.filename.endswith(('.xlsx', '.xls')):
#         raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")
    
#     try:
#         contents = await file.read()
#         df = pd.read_excel(BytesIO(contents), engine='openpyxl')
        
#         # Find the employee info row (contains 'Empcode')
#         emp_info_idx = df[df['Weekly Periodic Report'] == 'Empcode'].index[0]
#         emp_info = df.iloc[emp_info_idx]
        
#         empcode = str(emp_info['Unnamed: 1'])
#         name = str(emp_info['Unnamed: 4'])
        
#         header_idx = emp_info_idx + 1
#         data = df.iloc[header_idx + 1:].copy()
        
#         records = []
#         inserted_data = []  # Store clean records for returning
        
#         for _, row in data.iterrows():
#             if pd.isna(row['Weekly Periodic Report']):
#                 continue
            
#             try:
#                 date_val = pd.to_datetime(row['Weekly Periodic Report'])
#                 date_str = date_val.strftime('%Y-%m-%d')
                
#                 record = {
#                     "empcode": empcode,
#                     "name": name,
#                     "date": date_str,
#                     "shift": str(row['Unnamed: 1']),
#                     "intime": str(row['Unnamed: 2']),
#                     "late_in": str(row['Unnamed: 3']),
#                     "early_out": str(row['Unnamed: 4']),
#                     "outtime": str(row['Unnamed: 5']),
#                     "work_ot": str(row['01/05/2025 To 15/05/2025']),
#                     "overtime": str(row['Unnamed: 7']),
#                     "status": str(row['Unnamed: 8']),
#                     "remark": str(row['Unnamed: 9'] if not pd.isna(row['Unnamed: 9']) else '')
#                 }

#                 # Clean values
#                 record = {k: v if v not in ['nan', '--:--', 'NaT'] else '' for k, v in record.items()}

#                 doc_id = f"{empcode}_{date_str}_{record['shift']}"

#                 records.append({
#                     "_index": "attendance_records",
#                     "_id": doc_id,
#                     "_source": record
#                 })

#                 inserted_data.append(record)  # Store cleaned data

#             except Exception as e:
#                 continue  # Skip invalid rows

#         if not records:
#             raise HTTPException(status_code=400, detail="No valid attendance records found in the Excel file")

#         try:
#             success_count = auth_user_manager.bulk_index_attendance(records)
#             return {
#                 "message": "Excel file processed and attendance data stored successfully",
#                 "inserted_count": success_count,
#                 "inserted_data": inserted_data  # ✅ Return inserted data
#             }
#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"Failed to store attendance records: {str(e)}")

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to process Excel file: {str(e)}")

# @router.post("/upload_attendance_excel")
# async def upload_attendance_excel(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
#     user = get_current_user(token)
#     if not user or user.get("role") != "admin":
#         raise HTTPException(status_code=403, detail="Not authorized")

#     try:
#         contents = await file.read()
#         df = pd.read_excel(BytesIO(contents), engine='openpyxl')
#         df.columns = df.columns.astype(str)  # Ensure column names are strings

#         empcode_indices = df[df['Weekly Periodic Report'] == 'Empcode'].index.tolist()
#         records, inserted_data = [], []

#         for idx_num, idx in enumerate(empcode_indices):
#             empcode = str(df.at[idx, 'Unnamed: 1'])
#             name = str(df.at[idx, 'Unnamed: 4'])

#             header_idx = idx + 1
#             data_start = header_idx + 1
#             data_end = empcode_indices[idx_num + 1] if idx_num + 1 < len(empcode_indices) else len(df)

#             for i in range(data_start, data_end):
#                 row = df.iloc[i]
#                 if pd.isna(row['Weekly Periodic Report']):
#                     continue
#                 try:
#                     date_val = pd.to_datetime(row['Weekly Periodic Report'])
#                     date_str = date_val.strftime('%Y-%m-%d')

#                     record = {
#                         "empcode": empcode,
#                         "name": name,
#                         "date": date_str,
#                         "shift": str(row['Unnamed: 1']),
#                         "intime": str(row['Unnamed: 2']),
#                         "late_in": str(row['Unnamed: 3']),
#                         "early_out": str(row['Unnamed: 4']),
#                         "outtime": str(row['Unnamed: 5']),
#                         "work_ot": str(row['01/05/2025 To 15/05/2025']),
#                         "overtime": str(row['Unnamed: 7']),
#                         "status": str(row['Unnamed: 8']),
#                         "remark": str(row['Unnamed: 9']) if not pd.isna(row['Unnamed: 9']) else ''
#                     }

#                     # Clean values
#                     record = {k: v if v not in ['nan', '--:--', 'NaT'] else '' for k, v in record.items()}

#                     doc_id = f"{empcode}_{date_str}_{record['shift']}"
#                     records.append({
#                         "_index": "attendance_records",
#                         "_id": doc_id,
#                         "_source": record
#                     })
#                     inserted_data.append(record)
#                 except Exception:
#                     continue

#         if not records:
#             raise HTTPException(status_code=400, detail="No valid attendance records found")

#         success_count = auth_user_manager.bulk_index_attendance(records)
#         return {
#             "message": "Excel file processed and attendance data stored successfully",
#             "inserted_count": success_count,
#             "inserted_data": inserted_data
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to process Excel file: {str(e)}")

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
