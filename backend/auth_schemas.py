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

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional


# ── PIN complexity helpers ────────────────────────────────────────────────────

_WEAK_PINS = {
    "000000", "111111", "222222", "333333", "444444",
    "555555", "666666", "777777", "888888", "999999",
    "123456", "654321", "123123", "112233", "121212",
    "010101", "696969", "131313", "420420", "abcdef",
}

def _is_sequential(pin: str) -> bool:
    """Check if PIN is a sequential ascending/descending pattern."""
    asc = all(int(pin[i+1]) - int(pin[i]) == 1 for i in range(len(pin)-1))
    desc = all(int(pin[i]) - int(pin[i+1]) == 1 for i in range(len(pin)-1))
    return asc or desc

def _validate_pin_strength(pin: str) -> str:
    if pin in _WEAK_PINS:
        raise ValueError("This PIN is too common. Please choose a stronger PIN.")
    if len(set(pin)) == 1:
        raise ValueError("PIN cannot be all the same digit.")
    if pin.isdigit() and _is_sequential(pin):
        raise ValueError("PIN cannot be a sequential pattern.")
    return pin


# ── RegisterPage ─────────────────────────────────────────────────────────────

class RegisterPayload(BaseModel):
    full_name: str
    phone: str
    email: EmailStr
    pin: str = Field(..., min_length=6, max_length=6)
    nid_number: str
    user_type: str = "personal"   # 'personal' | 'agent'

    @field_validator("pin")
    @classmethod
    def pin_must_be_strong(cls, v: str) -> str:
        return _validate_pin_strength(v)


# ── OTPPage ───────────────────────────────────────────────────────────────────

class SendOTPRequest(BaseModel):
    email: EmailStr
    purpose: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    purpose: Optional[str] = None
    new_pin: Optional[str] = Field(None, min_length=6, max_length=6)
    confirm_new_pin: Optional[str] = Field(None, min_length=6, max_length=6)

    @field_validator("new_pin")
    @classmethod
    def new_pin_must_be_strong(cls, v: str | None) -> str | None:
        if v is not None:
            return _validate_pin_strength(v)
        return v


# ── LoginPage ─────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    phone: str
    pin: str


class ChangePinRequest(BaseModel):
    old_pin: str = Field(..., min_length=6, max_length=6)
    new_pin: str = Field(..., min_length=6, max_length=6)

    @field_validator("new_pin")
    @classmethod
    def new_pin_must_be_strong(cls, v: str) -> str:
        return _validate_pin_strength(v)


class ResetPinRequest(BaseModel):
    new_pin: str = Field(..., min_length=6, max_length=6)
    confirm_pin: str = Field(..., min_length=6, max_length=6)

    @field_validator("new_pin")
    @classmethod
    def new_pin_must_be_strong(cls, v: str) -> str:
        return _validate_pin_strength(v)


# ── AdminLoginPage ────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    admin_id: int
    pin: str


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str]
    email: Optional[EmailStr]

