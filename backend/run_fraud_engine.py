import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('.env')

fraud_query = """
-- RULE 1: Large Transaction (> 50,000)
SELECT 
    t.txn_id,
    w.user_id,
    t.amount,
    'large_transaction' AS rule,
    60 AS risk_score
FROM transactions t
JOIN wallets w ON t.sender_wallet_id = w.wallet_id
WHERE t.amount > 50000
  AND t.status = 'success'
  AND t.txn_at >= NOW() - INTERVAL '24 hours'

UNION ALL

-- RULE 2: Rapid Fire Transactions (Enhanced Window)
SELECT 
    t.txn_id,
    w.user_id,
    t.amount,
    'rapid_fire_suspicious_pattern' AS rule,
    60 AS risk_score
FROM transactions t
JOIN wallets w ON t.sender_wallet_id = w.wallet_id
JOIN LATERAL (
    SELECT 
        COUNT(*) AS txn_count,
        COALESCE(SUM(t2.amount), 0) AS total_amount,
        COUNT(DISTINCT t2.receiver_wallet_id) AS unique_receivers
    FROM transactions t2
    WHERE t2.sender_wallet_id = t.sender_wallet_id
      AND t2.status = 'success'
      AND t2.txn_at BETWEEN t.txn_at - INTERVAL '10 minutes' AND t.txn_at
) win ON TRUE
WHERE t.status = 'success'
  AND win.txn_count > 5
  AND win.total_amount > 20000
  AND win.unique_receivers > 3

UNION ALL

-- RULE 3: New Account High Activity (< 24 hours)
SELECT 
    t.txn_id,
    w.user_id,
    t.amount,
    'new_account_activity' AS rule,
    40 AS risk_score
FROM transactions t
JOIN wallets w ON t.sender_wallet_id = w.wallet_id
JOIN users u ON w.user_id = u.user_id
WHERE t.amount > 10000
  AND t.status = 'success'
  AND u.created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

-- RULE 4: Unusual Hours (1 AM – 4 AM)
SELECT
	t.txn_id,
	w.user_id,
	t.amount,
	'unusual_hours' as rule,
	20 as risk_score
FROM transactions t
JOIN wallets w on t.sender_wallet_id=w.wallet_id
where t.status='success'
	and t.txn_at::time between '01:00:00' AND '04:59:59'

UNION ALL

-- RULE 5: Daily Limit Breach (> 80%)
SELECT 
    t.txn_id,
    w.user_id,
    t.amount,
    'daily_limit_reach' AS rule,
    45 AS risk_score
FROM transactions t
JOIN wallets w ON t.sender_wallet_id = w.wallet_id
JOIN users u ON w.user_id = u.user_id
JOIN transaction_limits tl ON tl.user_id = u.user_id
WHERE t.status = 'success'
  AND (
        SELECT COALESCE(SUM(t2.amount), 0)
        FROM transactions t2
        WHERE t2.sender_wallet_id = t.sender_wallet_id
          AND DATE(t2.txn_at) = DATE(t.txn_at)
          AND t2.status = 'success'
      ) > tl.daily_limit * 0.80
"""

def run_fraud_engine():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    # 1. Run the user's fraud engine query
    print("Running fraud detection engine...")
    cur.execute(fraud_query)
    anomalies = cur.fetchall()
    
    print(f"Engine detected {len(anomalies)} anomalous transactions!")
    
    # 2. Insert anomalies into fraud_flags if they don't already exist
    for anomaly in anomalies:
        txn_id, user_id, amount, rule, risk_score = anomaly

        # Prevent duplicate entries for the same transaction and rule combination
        cur.execute("SELECT 1 FROM fraud_flags WHERE txn_id = %s AND rule_triggered = %s", (txn_id, rule))
        if cur.fetchone():
            continue

        print(f"Flagging txn {txn_id} (User {user_id}) - Rule: {rule}")
        cur.execute("""
            INSERT INTO fraud_flags (txn_id, user_id, rule_triggered, risk_score, flagged_at)
            VALUES (%s, %s, %s, %s, NOW())
        """, (txn_id, user_id, rule, risk_score))
        
    conn.commit()
    cur.close()
    conn.close()
    print("Engine execution complete. Database updated.")

if __name__ == "__main__":
    run_fraud_engine()
