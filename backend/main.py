import os
import random
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from passlib.context import CryptContext
from fastapi import FastAPI, HTTPException, status, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import jwt

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

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET environment variable is not set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    email: EmailStr
    pin: str
    user_type: str = 'personal'

class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class LoginRequest(BaseModel):
    phone: str
    pin: str

class SendMoneyRequest(BaseModel):
    receiver_phone: str
    amount: float
    pin: str

def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def send_email_otp(email_to: str, otp: str):
    email_user = os.getenv("GMAIL_USER")
    email_pass = os.getenv("GMAIL_APP_PASSWORD")
    if not email_user or not email_pass:
        print(f"Warning: Email credentials not configured. OTP for {email_to} is {otp}")
        return
    msg = EmailMessage()
    msg['Subject'] = 'Your PoishaGo Verification Code'
    msg['From'] = email_user
    msg['To'] = email_to
    msg.set_content(f"Hello,\n\nYour PoishaGo verification code is: {otp}\n\nThis code will expire in 5 minutes. If you did not request this code, please ignore this email.\n\nThank you,\nThe PoishaGo Team")
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(email_user, email_pass)
            smtp.send_message(msg)
    except Exception as e:
        print(f"Failed to send email: {e}")

@app.post("/api/register")
def register_user(request: RegisterRequest):
    hashed_password = pwd_context.hash(request.pin)
    otp = f"{random.randint(100000, 999999)}"
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, is_verified FROM users WHERE email = %s OR phone = %s", (request.email, request.phone))
            existing_user = cur.fetchone()
            
            user_id = None
            if existing_user:
                if existing_user[1]:
                    raise HTTPException(status_code=400, detail="User already registered and verified.")
                else:
                    user_id = existing_user[0]
                    cur.execute("UPDATE users SET full_name=%s, phone=%s, email=%s, password_hash=%s, user_type=%s WHERE user_id=%s", 
                                (request.full_name, request.phone, request.email, hashed_password, request.user_type, user_id))
            else:
                cur.execute("""
                    INSERT INTO users (full_name, phone, email, password_hash, user_type, is_verified)
                    VALUES (%s, %s, %s, %s, %s, FALSE) RETURNING user_id
                """, (request.full_name, request.phone, request.email, hashed_password, request.user_type))
                user_id = cur.fetchone()[0]

            expires_at = datetime.utcnow() + timedelta(minutes=5)
            cur.execute("""
                INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at)
                VALUES (%s, %s, 'register', %s)
            """, (user_id, otp, expires_at))
            conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

    send_email_otp(request.email, otp)
    return {"message": "Registration initiated. OTP sent."}

@app.post("/api/send-otp")
def send_otp(request: SendOTPRequest):
    conn = get_db_connection()
    otp = f"{random.randint(100000, 999999)}"
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM users WHERE email = %s", (request.email,))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found.")
            
            user_id = user[0]
            expires_at = datetime.utcnow() + timedelta(minutes=5)
            cur.execute("""
                INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at)
                VALUES (%s, %s, 'login', %s)
            """, (user_id, otp, expires_at))
            conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

    send_email_otp(request.email, otp)
    return {"message": "OTP sent successfully"}

@app.post("/api/verify-otp")
def verify_otp(request: VerifyOTPRequest):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT user_id FROM users WHERE email = %s", (request.email,))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=400, detail="User not found.")
            
            user_id = user['user_id']
            
            cur.execute("""
                SELECT otp_id, purpose FROM otp_verifications 
                WHERE user_id = %s AND otp_code = %s AND is_used = FALSE AND expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1
            """, (user_id, request.otp))
            otp_record = cur.fetchone()
            
            if not otp_record:
                raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
            
            cur.execute("UPDATE otp_verifications SET is_used = TRUE WHERE otp_id = %s", (otp_record['otp_id'],))
            
            if otp_record['purpose'] == 'register':
                cur.execute("UPDATE users SET is_verified = TRUE WHERE user_id = %s", (user_id,))
                
                cur.execute("SELECT wallet_id FROM wallets WHERE user_id = %s", (user_id,))
                if not cur.fetchone():
                    wallet_number = f"PG-WAL-{user_id:05d}"
                    cur.execute("INSERT INTO wallets (user_id, wallet_number, balance, is_active) VALUES (%s, %s, 0.00, TRUE)", (user_id, wallet_number))
                
            conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

    return {"message": "OTP verified successfully"}

@app.post("/api/login")
def login(request: LoginRequest):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT user_id, password_hash, is_verified FROM users WHERE phone = %s", (request.phone,))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            if not pwd_context.verify(request.pin, user['password_hash']):
                raise HTTPException(status_code=401, detail="Invalid credentials")
                
            if not user['is_verified']:
                raise HTTPException(status_code=403, detail="User not verified")
                
            token = create_access_token({"sub": str(user['user_id'])})
            return {"access_token": token, "token_type": "bearer"}
    finally:
        conn.close()

class AdminLoginRequest(BaseModel):
    username: str
    passcode: str

@app.post("/api/admin/login")
def admin_login(request: AdminLoginRequest):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT u.user_id, u.password_hash, u.is_verified, a.role 
                FROM users u
                JOIN admins a ON u.user_id = a.user_id
                WHERE u.phone = %s OR u.email = %s
            """, (request.username, request.username))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=401, detail="Invalid admin credentials")
            
            if not pwd_context.verify(request.passcode, user['password_hash']):
                raise HTTPException(status_code=401, detail="Invalid admin credentials")
                
            token = create_access_token({"sub": str(user['user_id'])})
            return {"access_token": token, "token_type": "bearer", "role": user['role']}
    finally:
        conn.close()

@app.get("/api/me")
def get_me(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT u.user_id, u.full_name, u.phone, u.email, u.user_type, u.is_verified,
                       w.wallet_number, w.balance, w.wallet_id
                FROM users u
                LEFT JOIN wallets w ON u.user_id = w.user_id
                WHERE u.user_id = %s
            """, (user_id,))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
                
            # Also fetch reward points
            cur.execute("SELECT current_points FROM reward_points WHERE user_id = %s", (user_id,))
            reward = cur.fetchone()
            user['current_points'] = reward['current_points'] if reward else 0
            # Tier logic mock
            user['tier'] = 'bronze'
            
            return user
    finally:
        conn.close()

@app.post("/api/transactions/send")
def send_money(request: SendMoneyRequest, user_id: str = Depends(get_current_user)):
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check PIN
            cur.execute("SELECT password_hash FROM users WHERE user_id = %s", (user_id,))
            sender_user = cur.fetchone()
            if not pwd_context.verify(request.pin, sender_user['password_hash']):
                raise HTTPException(status_code=401, detail="Invalid PIN")
                
            # Get sender wallet
            cur.execute("SELECT wallet_id, balance FROM wallets WHERE user_id = %s", (user_id,))
            sender = cur.fetchone()
            if not sender:
                raise HTTPException(status_code=400, detail="Sender wallet not found")
            
            if sender['balance'] < request.amount:
                raise HTTPException(status_code=400, detail="Insufficient funds")
                
            # Get receiver wallet
            cur.execute("""
                SELECT w.wallet_id FROM wallets w 
                JOIN users u ON w.user_id = u.user_id 
                WHERE u.phone = %s
            """, (request.receiver_phone,))
            receiver = cur.fetchone()
            if not receiver:
                raise HTTPException(status_code=400, detail="Receiver not found")
                
            # Perform transaction safely
            cur.execute("UPDATE wallets SET balance = balance - %s WHERE wallet_id = %s", (request.amount, sender['wallet_id']))
            cur.execute("UPDATE wallets SET balance = balance + %s WHERE wallet_id = %s", (request.amount, receiver['wallet_id']))
            
            # Log transaction
            txn_id = f"TXN{int(datetime.utcnow().timestamp())}{random.randint(100,999)}"
            cur.execute("""
                INSERT INTO transactions (reference_no, sender_wallet_id, receiver_wallet_id, txn_type, amount, fee, status)
                VALUES (%s, %s, %s, 'transfer', %s, 0.00, 'success')
            """, (txn_id, sender['wallet_id'], receiver['wallet_id'], request.amount))
            
            conn.commit()
            return {"message": "Transaction successful", "transaction_id": txn_id}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


class CashInOutRequest(BaseModel):
    agent_phone: str
    amount: float
    pin: str

class BillPaymentRequest(BaseModel):
    biller_name: str
    account_number: str
    amount: float
    pin: str

class RedeemRequest(BaseModel):
    points: int
    bdt_value: float

class RewardOptionRequest(BaseModel):
    title: str
    points_required: int
    value_bdt: float
    category: str

class BillCategoryRequest(BaseModel):
    id: str
    label: str
    icon_id: str
    color: str


@app.get("/api/admin/transactions")
def get_admin_transactions():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT t.txn_id, t.sender_wallet_id, t.receiver_wallet_id, t.amount, t.txn_type, t.status, t.fee, t.reference_no, t.txn_at,
                       su.full_name as sender_name, sw.wallet_number as sender_wallet_num,
                       ru.full_name as receiver_name, rw.wallet_number as receiver_wallet_num
                FROM transactions t
                JOIN wallets sw ON t.sender_wallet_id = sw.wallet_id
                JOIN users su ON sw.user_id = su.user_id
                JOIN wallets rw ON t.receiver_wallet_id = rw.wallet_id
                JOIN users ru ON rw.user_id = ru.user_id
                ORDER BY t.txn_at DESC
                LIMIT 500
            """)
            txns = cur.fetchall()
            
            result = []
            for t in txns:
                result.append({
                    "txn_id": t['txn_id'],
                    "sender_wallet_id": t['sender_wallet_num'],
                    "sender_name": t['sender_name'],
                    "receiver_wallet_id": t['receiver_wallet_num'],
                    "receiver_name": t['receiver_name'],
                    "amount": float(t['amount']),
                    "txn_type": t['txn_type'],
                    "status": t['status'],
                    "fee": float(t['fee']),
                    "reference_no": t['reference_no'],
                    "txn_at": t['txn_at'].isoformat() if hasattr(t['txn_at'], 'isoformat') else t['txn_at']
                })
            return result
    finally:
        conn.close()

@app.get("/api/transactions")
def get_transactions(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT wallet_id FROM wallets WHERE user_id = %s", (user_id,))
            wallet = cur.fetchone()
            if not wallet: return []

            # Fetch transactions where user is sender or receiver
            cur.execute("""
                SELECT t.txn_id, t.sender_wallet_id, t.receiver_wallet_id, t.amount, t.txn_type, t.status, t.fee, t.reference_no, t.txn_at,
                       su.full_name as sender_name, sw.wallet_number as sender_wallet_num,
                       ru.full_name as receiver_name, rw.wallet_number as receiver_wallet_num
                FROM transactions t
                JOIN wallets sw ON t.sender_wallet_id = sw.wallet_id
                JOIN users su ON sw.user_id = su.user_id
                JOIN wallets rw ON t.receiver_wallet_id = rw.wallet_id
                JOIN users ru ON rw.user_id = ru.user_id
                WHERE t.sender_wallet_id = %s OR t.receiver_wallet_id = %s
                ORDER BY t.txn_at DESC
                LIMIT 50
            """, (wallet['wallet_id'], wallet['wallet_id']))
            txns = cur.fetchall()
            
            result = []
            for t in txns:
                result.append({
                    "txn_id": t['txn_id'],
                    "sender_wallet_id": t['sender_wallet_num'],
                    "sender_name": t['sender_name'],
                    "receiver_wallet_id": t['receiver_wallet_num'],
                    "receiver_name": t['receiver_name'],
                    "amount": float(t['amount']),
                    "txn_type": t['txn_type'],
                    "status": t['status'],
                    "fee": float(t['fee']),
                    "reference_no": t['reference_no'],
                    "txn_at": t['txn_at'].isoformat()
                })
            return result
    finally:
        conn.close()

@app.get("/api/contacts")
def get_contacts(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT fc.contact_id, fc.nickname, u.full_name, u.phone
                FROM favorite_contacts fc
                JOIN users u ON fc.contact_user_id = u.user_id
                WHERE fc.owner_user_id = %s
                ORDER BY fc.added_at DESC
                LIMIT 20
            """, (user_id,))
            contacts = cur.fetchall()

            result = []
            for c in contacts:
                display_name = c['nickname'] if c['nickname'] else c['full_name']
                initials = "".join([n[0] for n in display_name.split()[:2]]).upper()
                result.append({
                    "contact_id": c['contact_id'],
                    "name": display_name,
                    "phone": c['phone'],
                    "initials": initials if initials else "U"
                })
            return result
    finally:
        conn.close()

class AddContactRequest(BaseModel):
    phone: str
    nickname: str = ""

@app.post("/api/contacts")
def add_contact(req: AddContactRequest, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check the phone number belongs to a registered user
            cur.execute("SELECT user_id, full_name FROM users WHERE phone = %s", (req.phone,))
            contact_user = cur.fetchone()
            if not contact_user:
                raise HTTPException(status_code=404, detail="No PoishaGo account found with this phone number")
            if str(contact_user['user_id']) == str(user_id):
                raise HTTPException(status_code=400, detail="You cannot add yourself as a contact")

            # Check if already saved
            cur.execute("""
                SELECT contact_id FROM favorite_contacts
                WHERE owner_user_id = %s AND contact_user_id = %s
            """, (user_id, contact_user['user_id']))
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="This contact is already in your list")

            # Insert the new contact
            cur.execute("""
                INSERT INTO favorite_contacts (owner_user_id, contact_user_id, nickname)
                VALUES (%s, %s, %s)
            """, (user_id, contact_user['user_id'], req.nickname.strip() or None))
            conn.commit()
            return {"message": "Contact added", "name": contact_user['full_name']}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/api/contacts/{contact_id}")
def remove_contact(contact_id: int, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM favorite_contacts
                WHERE contact_id = %s AND owner_user_id = %s
            """, (contact_id, user_id))
            conn.commit()
            return {"message": "Contact removed"}
    finally:
        conn.close()


def _perform_transaction(cur, sender_user_id, sender_pin, amount, receiver_phone, txn_type):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be > 0")
        
    cur.execute("SELECT password_hash FROM users WHERE user_id = %s", (sender_user_id,))
    sender_user = cur.fetchone()
    if not pwd_context.verify(sender_pin, sender_user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid PIN")
        
    cur.execute("SELECT wallet_id, balance FROM wallets WHERE user_id = %s", (sender_user_id,))
    sender = cur.fetchone()
    if not sender or sender['balance'] < amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
        
    cur.execute("""
        SELECT w.wallet_id FROM wallets w 
        JOIN users u ON w.user_id = u.user_id 
        WHERE u.phone = %s
    """, (receiver_phone,))
    receiver = cur.fetchone()
    if not receiver:
        raise HTTPException(status_code=400, detail="Receiver not found")
        
    cur.execute("UPDATE wallets SET balance = balance - %s WHERE wallet_id = %s", (amount, sender['wallet_id']))
    cur.execute("UPDATE wallets SET balance = balance + %s WHERE wallet_id = %s", (amount, receiver['wallet_id']))
    
    txn_id = f"TXN{int(datetime.utcnow().timestamp())}{random.randint(100,999)}"
    cur.execute("""
        INSERT INTO transactions (reference_no, sender_wallet_id, receiver_wallet_id, txn_type, amount, fee, status)
        VALUES (%s, %s, %s, %s, %s, 0.00, 'success')
        RETURNING txn_id
    """, (txn_id, sender['wallet_id'], receiver['wallet_id'], txn_type, amount))
    
    return txn_id

@app.post("/api/transactions/cashout")
def cash_out(request: CashInOutRequest, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            ref = _perform_transaction(cur, user_id, request.pin, request.amount, request.agent_phone, 'cashout')
            conn.commit()
            return {"message": "Cash out successful", "transaction_id": ref}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/transactions/cashin")
def cash_in(request: CashInOutRequest, user_id: str = Depends(get_current_user)):
    # Cash in is from agent to user, but since the user initiates it in the app for this demo, 
    # we'll actually deduct from agent and add to user.
    # To keep it simple and safe for the user's PIN, we just simulate the agent approving it.
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify user's pin just to confirm request
            cur.execute("SELECT password_hash FROM users WHERE user_id = %s", (user_id,))
            sender_user = cur.fetchone()
            if not pwd_context.verify(request.pin, sender_user['password_hash']):
                raise HTTPException(status_code=401, detail="Invalid PIN")
                
            cur.execute("""
                SELECT w.wallet_id, w.balance FROM wallets w 
                JOIN users u ON w.user_id = u.user_id 
                WHERE u.phone = %s
            """, (request.agent_phone,))
            agent = cur.fetchone()
            if not agent or agent['balance'] < request.amount:
                raise HTTPException(status_code=400, detail="Agent has insufficient funds")
                
            cur.execute("SELECT wallet_id FROM wallets WHERE user_id = %s", (user_id,))
            user_wallet = cur.fetchone()
            
            cur.execute("UPDATE wallets SET balance = balance - %s WHERE wallet_id = %s", (request.amount, agent['wallet_id']))
            cur.execute("UPDATE wallets SET balance = balance + %s WHERE wallet_id = %s", (request.amount, user_wallet['wallet_id']))
            
            txn_id = f"TXN{int(datetime.utcnow().timestamp())}{random.randint(100,999)}"
            cur.execute("""
                INSERT INTO transactions (reference_no, sender_wallet_id, receiver_wallet_id, txn_type, amount, fee, status)
                VALUES (%s, %s, %s, 'cashin', %s, 0.00, 'success')
            """, (txn_id, agent['wallet_id'], user_wallet['wallet_id'], request.amount))
            
            conn.commit()
            return {"message": "Cash in successful", "transaction_id": txn_id}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/transactions/bill")
def pay_bill(request: BillPaymentRequest, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            ref = _perform_transaction(cur, user_id, request.pin, request.amount, 'BILL_SYSTEM', 'bill')
            conn.commit()
            return {"message": "Bill paid successfully", "transaction_id": ref}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

class RechargeRequest(BaseModel):
    phone: str
    operator: str
    amount: float
    pin: str

@app.post("/api/recharge")
def mobile_recharge(request: RechargeRequest, user_id: str = Depends(get_current_user)):
    if request.amount < 10 or request.amount > 1000:
        raise HTTPException(status_code=400, detail="Recharge amount must be between ৳10 and ৳1,000")
    valid_operators = ['gp', 'robi', 'airtel', 'banglalink', 'teletalk']
    if request.operator not in valid_operators:
        raise HTTPException(status_code=400, detail="Invalid operator selected")
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            ref = _perform_transaction(cur, user_id, request.pin, request.amount, 'RECHARGE_SYSTEM', 'bill')
            conn.commit()
            return {"message": "Recharge successful", "transaction_id": ref}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/notifications")
def get_notifications(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT notification_id as id, title, message, 'system' as notif_type, is_read, created_at
                FROM notifications
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 50
            """, (user_id,))
            notifs = cur.fetchall()
            for n in notifs:
                n['created_at'] = n['created_at'].isoformat()
            return notifs
    finally:
        conn.close()

@app.post("/api/rewards/redeem")
def redeem_rewards(request: RedeemRequest, user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Add funds
            cur.execute("UPDATE wallets SET balance = balance + %s WHERE user_id = %s RETURNING wallet_id", (request.bdt_value, user_id))
            wallet = cur.fetchone()
            if not wallet: raise HTTPException(status_code=404, detail="Wallet not found")
            
            # Deduct points
            cur.execute("UPDATE reward_points SET current_points = current_points - %s WHERE user_id = %s AND current_points >= %s", (request.points, user_id, request.points))
            if cur.rowcount == 0:
                raise HTTPException(status_code=400, detail="Insufficient points")
                
            # Log redemption
            cur.execute("""
                INSERT INTO reward_redemptions (user_id, points_used, amount_bdt)
                VALUES (%s, %s, %s)
            """, (user_id, request.points, request.bdt_value))
            
            # Add transaction log for the wallet credit
            txn_id = f"REWARD{int(datetime.utcnow().timestamp())}"
            cur.execute("""
                INSERT INTO transactions (reference_no, sender_wallet_id, receiver_wallet_id, txn_type, amount, fee, status)
                VALUES (%s, (SELECT wallet_id FROM wallets WHERE wallet_number = 'BILL_SYSTEM' LIMIT 1), %s, 'cashin', %s, 0, 'success')
            """, (txn_id, wallet['wallet_id'], request.bdt_value))
            
            conn.commit()
            return {"message": "Points redeemed successfully", "bdt_added": request.bdt_value}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/rewards/options")
def get_reward_options():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id, title, points_required as "pointsRequired", value_bdt as "valueBDT", category
                FROM reward_options
                ORDER BY id ASC
            """)
            return cur.fetchall()
    finally:
        conn.close()

@app.get("/api/rewards/history")
def get_rewards_history(user_id: str = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT redemption_id as id, points_used as points, amount_bdt as bdt, to_char(created_at, 'YYYY-MM-DD') as date
                FROM reward_redemptions
                WHERE user_id = %s
                ORDER BY created_at DESC
            """, (user_id,))
            return cur.fetchall()
    finally:
        conn.close()


@app.get("/api/agents")
def get_agents():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT user_id::text as id, full_name as name, 'Verified Agent Store' as location, phone 
                FROM users WHERE user_type = 'agent'
            """)
            return cur.fetchall()
    finally:
        conn.close()

@app.get("/api/rewards/leaderboard")
def get_leaderboard():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT u.full_name as name, r.current_points as points
                FROM reward_points r
                JOIN users u ON r.user_id = u.user_id
                ORDER BY r.current_points DESC
                LIMIT 10
            """)
            rows = cur.fetchall()
            for i, row in enumerate(rows):
                row['rank'] = i + 1
                row['tier'] = 'platinum' if row['points'] >= 10000 else 'gold' if row['points'] >= 5000 else 'silver' if row['points'] >= 1000 else 'bronze'
                row['medal'] = '🥇' if i == 0 else '🥈' if i == 1 else '🥉' if i == 2 else ''
            return rows
    finally:
        conn.close()

@app.get("/api/bill/categories")
def get_bill_categories():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, label, icon_id, color FROM bill_categories")
            return cur.fetchall()
    finally:
        conn.close()

@app.get("/api/admin/revenue-trend")
def get_revenue_trend():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                WITH dates AS (
                    SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval)::date AS day_date
                )
                SELECT to_char(dates.day_date, 'Dy') AS day, COALESCE(SUM(t.fee), 0) AS revenue
                FROM dates
                LEFT JOIN transactions t ON t.txn_at::date = dates.day_date
                GROUP BY dates.day_date
                ORDER BY dates.day_date ASC;
            """)
            rows = cur.fetchall()
            if not rows:
                return [
                    { "day": "Mon", "revenue": 0 },
                    { "day": "Tue", "revenue": 0 },
                    { "day": "Wed", "revenue": 0 },
                    { "day": "Thu", "revenue": 0 },
                    { "day": "Fri", "revenue": 0 },
                    { "day": "Sat", "revenue": 0 },
                    { "day": "Sun", "revenue": 0 }
                ]
            return rows
    finally:
        conn.close()


@app.get("/api/rewards/tiers")
def get_reward_tiers():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id, name, threshold, description, color_style as "colorStyle", 
                       border_class as "borderClass", bg_class as "bgClass"
                FROM reward_tiers
            """)
            return cur.fetchall()
    finally:
        conn.close()

@app.post("/api/admin/rewards/options")
def create_reward_option(req: RewardOptionRequest):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO reward_options (title, points_required, value_bdt, category)
                VALUES (%s, %s, %s, %s)
            """, (req.title, req.points_required, req.value_bdt, req.category))
            conn.commit()
            return {"message": "Reward option added"}
    finally:
        conn.close()

@app.post("/api/admin/bill/categories")
def create_bill_category(req: BillCategoryRequest):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO bill_categories (id, label, icon_id, color)
                VALUES (%s, %s, %s, %s)
            """, (req.id, req.label, req.icon_id, req.color))
            conn.commit()
            return {"message": "Bill category added"}
    finally:
        conn.close()

@app.delete("/api/admin/rewards/options/{option_id}")
def delete_reward_option(option_id: int):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM reward_options WHERE id = %s", (option_id,))
            conn.commit()
            return {"message": "Reward option deleted"}
    finally:
        conn.close()

@app.delete("/api/admin/bill/categories/{category_id}")
def delete_bill_category(category_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM bill_categories WHERE id = %s", (category_id,))
            conn.commit()
            return {"message": "Bill category deleted"}
    finally:
        conn.close()


@app.get("/api/rewards/config")
def get_rewards_config():
    return {
        "conversion_rate": 0.10,
        "slider_min": 100,
        "slider_max": 5000,
        "slider_step": 100
    }


@app.get("/api/users")
def get_users():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT u.user_id, u.full_name, u.phone, u.email, u.user_type, u.is_verified,
                       w.wallet_number, COALESCE(w.balance, 0.00) as balance, 
                       (CASE WHEN w.is_active THEN 'active' ELSE 'blocked' END) as status, 
                       COALESCE(rp.current_points, 0) as current_points,
                       COALESCE(rp.tier, 'bronze') as tier
                FROM users u
                LEFT JOIN wallets w ON u.user_id = w.user_id
                LEFT JOIN reward_points rp ON u.user_id = rp.user_id
                ORDER BY u.created_at DESC
            """)
            return cur.fetchall()
    finally:
        conn.close()

@app.get("/api/fraud-flags")
def get_fraud_flags():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT flag_id, reference_no as txn_id, flagged_user as user_name, phone,
                       rule_triggered, risk_score, (reviewed_by_name IS NOT NULL) as reviewed,
                       flagged_at
                FROM vw_fraud_dashboard
                ORDER BY flagged_at DESC
            """)
            flags = cur.fetchall()
            for f in flags:
                f['flagged_at'] = f['flagged_at'].isoformat()
            return flags
    finally:
        conn.close()

@app.get("/api/campaigns")
def get_campaigns():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT occasion_id as id, occasion_name as title, cashback_pct as percentage_back,
                       max_cashback_bdt as max_limit_bdt, to_char(end_date, 'YYYY-MM-DD') as valid_until,
                       is_active, to_char(created_at, 'YYYY-MM-DD') as created_at
                FROM occasion_cashbacks
                ORDER BY created_at DESC
            """)
            return cur.fetchall()
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
