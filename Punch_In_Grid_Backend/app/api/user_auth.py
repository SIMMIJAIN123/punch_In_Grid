from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from app.manager.user_auth_manager import SetPasswordRequest

from app.manager.user_auth_manager import (auth_user_manager, RegisterRequest,LoginRequest,UserResponse,LoginSuccessResponse)
from app.utils.jwt_helper import create_access_token, decode_access_token
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


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
    user, error = auth_user_manager.login(login_req)  # ✅ Corrected here

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
