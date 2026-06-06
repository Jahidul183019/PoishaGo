import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_otp_email(receiver_email: str, otp_code: str):
    # Configuration - Replace these with your actual SMTP server settings or env variables
    SMTP_SERVER = "smtp.gmail.com" 
    SMTP_PORT = 587
    SENDER_EMAIL = "your-system-email@gmail.com"
    SENDER_PASSWORD = "your-app-password" # Use an App Password, not your raw password

    # Create message container
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = receiver_email
    msg['Subject'] = "Verify Your Account Registration"

    # Email Body Architecture
    body = f"""
    <html>
        <body>
            <h2>Welcome to Our Platform!</h2>
            <p>Thank you for registering. Please use the secure 6-digit One-Time Password (OTP) below to complete your registration:</p>
            <h1 style="color: #4F46E5; letter-spacing: 2px;">{otp_code}</h1>
            <p>This code is valid for <b>5 minutes</b>. If you did not request this code, please ignore this email.</p>
        </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))

    try:
        # Establish connection with the email provider secure relay
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls() # Secure the connection
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, receiver_email, msg.as_string())
        server.quit()
        print(f"📧 Registration OTP successfully transmitted to: {receiver_email}")
    except Exception as e:
        # We log the error but don't crash the server since the DB transaction already succeeded.
        print(f"❌ Failed to transmit verification mailer: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Account initialized, but failed to send verification email. Please contact support."
        )