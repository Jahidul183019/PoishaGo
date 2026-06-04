import os
import random
import smtplib
from email.message import EmailMessage
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PoishaGo API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

# In-memory store for OTPs (email -> OTP). In production, use Redis or a DB.
otp_store = {}

@app.post("/api/send-otp")
async def send_otp(request: SendOTPRequest):
    email_user = os.getenv("GMAIL_USER")
    email_pass = os.getenv("GMAIL_APP_PASSWORD")

    if not email_user or not email_pass:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email credentials are not configured on the server."
        )

    # Generate 6-digit OTP
    otp = f"{random.randint(100000, 999999)}"
    
    # Store OTP in memory
    otp_store[request.email] = otp

    # Construct email
    msg = EmailMessage()
    msg['Subject'] = 'Your PoishaGo Verification Code'
    msg['From'] = email_user
    msg['To'] = request.email
    msg.set_content(f"""Hello,

Your PoishaGo verification code is: {otp}

This code will expire in 5 minutes. If you did not request this code, please ignore this email.

Thank you,
The PoishaGo Team""")

    # Send email via Gmail SMTP
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(email_user, email_pass)
            smtp.send_message(msg)
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email."
        )

    return {"message": "OTP sent successfully"}

@app.post("/api/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    expected_otp = otp_store.get(request.email)
    
    if not expected_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP found for this email. Please request a new one."
        )
        
    if request.otp != expected_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP."
        )
        
    # Clear the OTP after successful verification
    del otp_store[request.email]
    
    return {"message": "OTP verified successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
