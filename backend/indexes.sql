CREATE INDEX IF NOT EXISTS idx_txn_sender ON transactions(sender_wallet_id);
CREATE INDEX IF NOT EXISTS idx_txn_receiver ON transactions(receiver_wallet_id);
CREATE INDEX IF NOT EXISTS idx_txn_status_at ON transactions(status, txn_at);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_user ON otp_verifications(user_id, is_used);
CREATE INDEX IF NOT EXISTS idx_fraud_user ON fraud_flags(user_id, risk_score);
