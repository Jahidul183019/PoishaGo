import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('.env')

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Get some users
cur.execute("SELECT user_id, full_name, phone FROM users LIMIT 3")
users = cur.fetchall()

if not users:
    print("No users found to attach fraud flags to.")
    exit(1)

# Generate mock flags
flags = [
    (None, users[0][0], "Velocity Check: Multiple large transfers in 1 hour", 85, None),
    (None, users[1][0], "Unusual Device Fingerprint", 45, None),
    (None, users[2][0], "Geographic Anomaly: IP location mismatch", 92, None)
]

# Insert flags
for flag in flags:
    cur.execute("""
        INSERT INTO fraud_flags (txn_id, user_id, rule_triggered, risk_score, reviewed_by)
        VALUES (%s, %s, %s, %s, %s)
    """, flag)

conn.commit()
cur.close()
conn.close()
print("Successfully seeded fraud flags!")
