"""
auth_schemas.py
---------------
Pydantic request/response models for the authentication flow.

Pages that use these:
  RegisterPage  → RegisterPayload
  OTPPage       → SendOTPRequest, VerifyOTPRequest
  LoginPage     → LoginRequest
  AdminLoginPage → AdminLoginRequest
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


# ── RegisterPage ─────────────────────────────────────────────────────────────

class RegisterPayload(BaseModel):
    full_name: str
    phone: str
    email: EmailStr
    pin: str = Field(..., min_length=6, max_length=6)
    nid_number: str
    user_type: str = "personal"   # 'personal' | 'agent'


# ── OTPPage ───────────────────────────────────────────────────────────────────

class SendOTPRequest(BaseModel):
    email: EmailStr
    purpose: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    purpose: Optional[str] = None
    new_pin: Optional[str] = Field(None, min_length=6, max_length=6)


# ── LoginPage ─────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    phone: str
    pin: str


class ChangePinRequest(BaseModel):
    old_pin: str = Field(..., min_length=6, max_length=6)
    new_pin: str = Field(..., min_length=6, max_length=6)


class ResetPinRequest(BaseModel):
    new_pin: str = Field(..., min_length=6, max_length=6)


# ── AdminLoginPage ────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    admin_id: int
    pin: str


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str]
    email: Optional[EmailStr]
