drop table if exists favorite_contacts cascade;
drop table if exists occasion_cashbacks cascade;
drop table if exists reward_redemptions cascade;
drop table if exists reward_points cascade;
drop table if exists notifications cascade;
drop table if exists audit_logs cascade;
drop table if exists bill_payments cascade;
drop table if exists fraud_flags cascade;
drop table if exists admin_permissions cascade;
drop table if exists admins cascade;
drop table if exists transaction_limits cascade;
drop table if exists otp_verifications cascade;
drop table if exists transactions cascade;
drop table if exists wallets cascade;
drop table if exists users cascade;
drop view if exists vw_active_wallets cascade;
drop view if exists vw_fraud_dashboard cascade;

create table users(
		user_id serial primary key,
		full_name varchar(100) not null,
		phone varchar(15) not null unique,
		email varchar(120) not null unique,
		password_hash varchar(255) not null,
		nid varchar(20) unique,
		user_type varchar(20) not null default 'personal'
        check (user_type in ('personal','agent')),
		is_verified boolean not null default false,
		created_at timestamptz not null default now()
);

create table wallets(
		wallet_id serial primary key,
		user_id integer not null unique,
		wallet_number varchar(20) not null unique,
		balance numeric(15,2) not null default 0.00,
		currency char(3) not null default 'BDT',
		is_active boolean not null default true,
		created_at timestamptz not null default now(),
		constraint chk_balance_positive check(balance>=0),
		foreign key(user_id) references users(user_id)
		on delete restrict on update cascade
);

create table transactions(
	txn_id serial primary key,
	sender_wallet_id integer not null,
	receiver_wallet_id integer not null,
	amount numeric(15,2) not null,
	  txn_type varchar(20) not null
        check (txn_type in ('transfer','cashout','cashin','bill')),

    status varchar(20) not null default 'pending'
        check (status in ('pending','success','failed','flagged')),
	fee numeric(10,2) not null default 0.00,
	
	reference_no varchar(30) not null unique,
	txn_at timestamptz not null default now(),
	CONSTRAINT chk_amount_positive check(amount>0),
	CONSTRAINT chk_no_self_transfer check(sender_wallet_id <> receiver_wallet_id),
	foreign key (sender_wallet_id) REFERENCES wallets(wallet_id) on delete restrict,
	foreign key (receiver_wallet_id) REFERENCES wallets(wallet_id) on delete restrict
);

create table otp_verifications(
	otp_id serial primary key,
	user_id integer not null,
	otp_code varchar(6) not null,
	 purpose varchar(20) not null
        check (purpose in ('register','login','transfer')),
	expires_at timestamptz not null,
	is_used boolean not null default false,
	created_at timestamptz not null default now(),
	foreign key (user_id) references users(user_id) on delete cascade
);

CREATE TABLE transaction_limits (
    user_id INT PRIMARY KEY,
    max_txn NUMERIC(15,2) NOT NULL,
    daily_limit NUMERIC(15,2) NOT NULL,
    monthly_limit NUMERIC(15,2) NOT NULL,
    max_daily_txn_count INT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_max_txn CHECK (max_txn > 0),
    CONSTRAINT chk_daily_limit CHECK (daily_limit > 0),
    CONSTRAINT chk_monthly_limit CHECK (monthly_limit > 0),
    CONSTRAINT chk_max_daily_txn_count CHECK (max_daily_txn_count > 0)
);

CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_admin_role CHECK (
        role IN ('SUPER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT', 'RISK_MANAGER')
    )
);

CREATE TABLE admin_permissions (
    role VARCHAR(50) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    PRIMARY KEY (role, permission),
    CONSTRAINT chk_role CHECK (
        role IN ('SUPER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT', 'RISK_MANAGER')
    )
);

CREATE TABLE fraud_flags (
    flag_id SERIAL PRIMARY KEY,
    txn_id INT NOT NULL,
    user_id INT NOT NULL,
    rule_triggered VARCHAR(100) NOT NULL,
    risk_score INT CHECK (risk_score BETWEEN 1 AND 100),
    reviewed_by INT,
    flagged_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (txn_id) REFERENCES transactions(txn_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES admins(admin_id) ON DELETE SET NULL
);

CREATE TABLE bill_payments (
    bill_id SERIAL PRIMARY KEY,
    txn_id INT UNIQUE NOT NULL,
    user_id INT NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    bill_type VARCHAR(50) NOT NULL,
    account_no VARCHAR(50) NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('SUCCESS', 'FAIL', 'PENDING')),
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (txn_id) REFERENCES transactions(txn_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_bill_type CHECK (
        bill_type IN (
            'ELECTRICITY', 'WATER', 'GAS', 'INTERNET', 'MOBILE', 'OTHER'
        )
    ),
    CONSTRAINT chk_amount CHECK (amount > 0)
);

create table audit_logs(
	log_id serial primary key,
	admin_id int,
	action varchar(255) not null,
	target_table varchar(100) not null,
	target_id int,
	old_value JSONB,
	new_value JSONB,
	logged_at timestamptz default now(),
	foreign key(admin_id) references admins(admin_id) on delete set null
);

create table notifications(
	notif_id serial primary key,
	user_id int not null,
	message text not null,
	notif_type varchar(20) not null check(notif_type in('sms', 'email', 'in_app')),
	is_read boolean default false,
	created_at timestamptz default now(),
	foreign key(user_id) REFERENCES users(user_id) on delete cascade
);

create table reward_points(
	points_id serial primary key,
	user_id int unique not null REFERENCES users(user_id),
	current_points int default 0 check(current_points>=0) ,
	lifetime_earned int default 0 check(lifetime_earned>=0),
	lifetime_redeemed int default 0 check(lifetime_redeemed>=0),
	tier varchar(20) not null default 'bronze' check(tier in('bronze', 'silver', 'gold', 'platinum')),
 	tier_updated_at timestamptz default now(),
 	updated_at timestamptz default now()
);

create table reward_redemptions(
	redemption_id serial primary key,
	user_id integer not null,
	points_used integer not null,
	cashback_amount numeric(10,2) not null,
	conversion_rate numeric(6,4) not null default 0.1000,
	wallet_id integer not null,
	status varchar(20) not null default 'pending' check(status in('pending','credited','failed')),
	redeemed_at timestamptz not null default now(),
	constraint chk_point_used_min check(points_used >=100),
	constraint chk_point_used_max check(points_used <=5000),
	foreign key(user_id) references users(user_id) on delete cascade,
	foreign key(wallet_id) references wallets(wallet_id) on delete cascade
);

CREATE TABLE reward_options (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    points_required INT NOT NULL,
    value_bdt DECIMAL(12,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE occasion_cashbacks (
    occasion_id SERIAL PRIMARY KEY,
    occasion_name VARCHAR(100) NOT NULL,
    occasion_type VARCHAR(20) NOT NULL CHECK (occasion_type IN (
            'eid','puja','new_year','independence','other')),
    cashback_pct NUMERIC(5,2) NOT NULL CHECK (cashback_pct BETWEEN 0.5 AND 25.0),
    max_cashback NUMERIC(10,2) NOT NULL CHECK (max_cashback >= 0),
    min_txn_amount NUMERIC(10,2) NOT NULL CHECK (min_txn_amount >= 0),
    eligible_txn_type VARCHAR not null check(eligible_txn_type in('transfer','cashout','cashin','bill','all')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL CHECK (end_date >= start_date),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_occasion_cashbacks_admin FOREIGN KEY (created_by) REFERENCES admins(admin_id) on delete cascade
);

CREATE TABLE favorite_contacts (
    contact_id SERIAL PRIMARY KEY,
    owner_user_id INT NOT NULL,
    contact_user_id INT NOT NULL,
    nickname VARCHAR(50),
    free_cashout BOOLEAN DEFAULT TRUE,
    total_txn INT DEFAULT 0 CHECK (total_txN >= 0),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_owner_contact UNIQUE (owner_user_id, contact_user_id),
    CONSTRAINT chk_no_self CHECK (owner_user_id <> contact_user_id),
    FOREIGN KEY (owner_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (contact_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

INSERT INTO users (full_name, phone, email, password_hash, nid, user_type, is_verified, created_at) VALUES
  ('Rafiq Ahmed', '01711000001', 'rafiq@email.com', '$2b$12$hash001', '1990123456789', 'personal', TRUE, NOW() - INTERVAL '180 days'),
  ('Fatema Begum', '01711000002', 'fatema@email.com', '$2b$12$hash002', '1991234567890', 'personal', TRUE, NOW() - INTERVAL '150 days'),
  ('Nasreen Akter', '01711000003', 'nasreen@email.com', '$2b$12$hash003', '1992345678901', 'personal', TRUE, NOW() - INTERVAL '120 days'),
  ('Jubayer Islam', '01711000004', 'jubayer@email.com', '$2b$12$hash004', '1993456789012', 'personal', TRUE, NOW() - INTERVAL '90 days'),
  ('Rima Khatun', '01711000005', 'rima@email.com', '$2b$12$hash005', '1994567890123', 'personal', TRUE, NOW() - INTERVAL '60 days'),
  ('Kamal Hossain', '01711000006', 'kamal@email.com', '$2b$12$hash006', '1995678901234', 'agent', TRUE, NOW() - INTERVAL '200 days'),
  ('Sumon Mia', '01711000007', 'sumon@email.com', '$2b$12$hash007', '1996789012345', 'agent', TRUE, NOW() - INTERVAL '170 days'),
  ('Admin Raihan', '01711000008', 'raihan@email.com', '$2b$12$hash008', '1997890123456', 'personal', TRUE, NOW() - INTERVAL '365 days'),
  ('Admin Sadia', '01711000009', 'sadia@email.com', '$2b$12$hash009', '1998901234567', 'personal', TRUE, NOW() - INTERVAL '400 days'),
  ('Dormant Hasan', '01711000010', 'hasan@email.com', '$2b$12$hash010', '1999012345678', 'personal', TRUE, NOW() - INTERVAL '10 days'),
  ('Dormant Mitu', '01711000011', 'mitu@email.com', '$2b$12$hash011', '2000123456789', 'personal', FALSE, NOW() - INTERVAL '5 days'),
  ('Nayan Sarker', '01711000012', 'nayan@email.com', '$2b$12$hash012', '2001234567891', 'personal', TRUE, NOW() - INTERVAL '12 hours'),
  ('Tanvir Hossain', '01711000013', 'tanvir@email.com', '$2b$12$hash013', '2002345678902', 'personal', TRUE, NOW() - INTERVAL '200 days'),
  ('Maliha Chowdhury', '01711000014', 'maliha@email.com', '$2b$12$hash014', '2003456789013', 'personal', TRUE, NOW() - INTERVAL '250 days'),
  ('Arif Billah', '01711000015', 'arif@email.com', '$2b$12$hash015', '2004567890124', 'agent', TRUE, NOW() - INTERVAL '300 days');

INSERT INTO wallets (user_id, wallet_number, balance, currency, is_active) VALUES
  (1, 'PG-WAL-00001', 85000.00, 'BDT', TRUE),
  (2, 'PG-WAL-00002', 42000.50, 'BDT', TRUE),
  (3, 'PG-WAL-00003', 12000.75, 'BDT', TRUE),
  (4, 'PG-WAL-00004', 9500.00, 'BDT', TRUE),
  (5, 'PG-WAL-00005', 3200.25, 'BDT', TRUE),
  (6, 'PG-WAL-00006', 250000.00, 'BDT', TRUE),
  (7, 'PG-WAL-00007', 180000.00, 'BDT', TRUE),
  (8, 'PG-WAL-00008', 75000.00, 'BDT', TRUE),
  (9, 'PG-WAL-00009', 60000.00, 'BDT', TRUE),
  (10, 'PG-WAL-00010', 5000.00, 'BDT', TRUE),
  (11, 'PG-WAL-00011', 1000.00, 'BDT', FALSE),
  (12, 'PG-WAL-00012', 15000.00, 'BDT', TRUE),
  (13, 'PG-WAL-00013', 55000.00, 'BDT', TRUE),
  (14, 'PG-WAL-00014', 38000.00, 'BDT', TRUE),
  (15, 'PG-WAL-00015', 310000.00, 'BDT', TRUE);

INSERT INTO admins (user_id, role) VALUES
  (8, 'SUPER_ADMIN'),
  (9, 'FINANCE_ADMIN'),
  (6, 'RISK_MANAGER'),
  (7, 'SUPPORT');

INSERT INTO admin_permissions(role,permission) VALUES
('SUPER_ADMIN', 'MANAGE_USERS'),
('SUPER_ADMIN', 'VIEW_REPORTS'),
('SUPER_ADMIN', 'MANAGE_ADMINS'),
('FINANCE_ADMIN', 'MANAGE_TRANSACTIONS'),
('FINANCE_ADMIN', 'VIEW_REPORTS'),
('SUPPORT', 'HANDLE_COMPLAINTS'),
('SUPPORT', 'MANAGE_NOTIFICATIONS'),
('RISK_MANAGER', 'FLAG_TRANSACTIONS'),
('RISK_MANAGER', 'REVIEW_FRAUD');

INSERT INTO transaction_limits (user_id, max_txn, daily_limit, monthly_limit, max_daily_txn_count) VALUES
  (1, 25000.00, 50000.00, 500000.00, 10),
  (2, 25000.00, 50000.00, 500000.00, 10),
  (3, 25000.00, 50000.00, 500000.00, 10),
  (4, 25000.00, 50000.00, 500000.00, 10),
  (5, 25000.00, 50000.00, 500000.00, 10),
  (6, 200000.00, 500000.00, 5000000.00, 50),
  (7, 200000.00, 500000.00, 5000000.00, 50),
  (8, 25000.00, 50000.00, 500000.00, 10),
  (9, 25000.00, 50000.00, 500000.00, 10),
  (10, 25000.00, 50000.00, 500000.00, 10),
  (11, 25000.00, 50000.00, 500000.00, 10),
  (12, 25000.00, 50000.00, 500000.00, 10),
  (13, 25000.00, 50000.00, 500000.00, 10),
  (14, 25000.00, 50000.00, 500000.00, 10),
  (15, 200000.00, 500000.00, 5000000.00, 50);

INSERT INTO transactions (sender_wallet_id, receiver_wallet_id, amount, txn_type, status, fee, reference_no, txn_at) VALUES
  (1, 2, 5000.00, 'transfer', 'success', 0.00, 'PG-20260101-000001', '2026-01-05 10:00:00+06'),
  (6, 1, 8000.00, 'transfer', 'success', 0.00, 'PG-20260101-000002', '2026-01-10 14:00:00+06'),
  (7, 2, 3000.00, 'cashout', 'success', 45.00, 'PG-20260115-000003', '2026-01-15 09:30:00+06'),
  (13, 4, 12000.00, 'transfer', 'success', 0.00, 'PG-20260120-000004', '2026-01-20 11:00:00+06'),
  (14, 5, 2500.00, 'bill', 'success', 0.00, 'PG-20260125-000005', '2026-01-25 16:00:00+06'),
  (2, 3, 7000.00, 'transfer', 'success', 0.00, 'PG-20260205-000006', '2026-02-05 10:00:00+06'),
  (3, 1, 4500.00, 'cashout', 'success', 67.50, 'PG-20260210-000007', '2026-02-10 13:00:00+06'),
  (6, 4, 15000.00, 'transfer', 'success', 0.00, 'PG-20260215-000008', '2026-02-15 11:30:00+06'),
  (15, 1, 20000.00, 'transfer', 'success', 0.00, 'PG-20260220-000009', '2026-02-20 09:00:00+06'),
  (4, 2, 900.00, 'bill', 'success', 0.00, 'PG-20260225-000010', '2026-02-25 15:00:00+06'),
  (1, 3, 11000.00, 'transfer', 'success', 0.00, 'PG-20260305-000011', '2026-03-05 10:00:00+06'),
  (5, 6, 1500.00, 'cashout', 'success', 22.50, 'PG-20260310-000012', '2026-03-10 12:00:00+06'),
  (7, 3, 9000.00, 'transfer', 'success', 0.00, 'PG-20260315-000013', '2026-03-15 14:00:00+06'),
  (13, 2, 6000.00, 'bill', 'success', 0.00, 'PG-20260320-000014', '2026-03-20 11:00:00+06'),
  (14, 1, 18000.00, 'transfer', 'success', 0.00, 'PG-20260325-000015', '2026-03-25 16:00:00+06'),
  (2, 4, 3500.00, 'transfer', 'success', 0.00, 'PG-20260405-000016', '2026-04-05 10:00:00+06'),
  (6, 2, 25000.00, 'transfer', 'success', 0.00, 'PG-20260410-000017', '2026-04-10 11:00:00+06'),
  (1, 5, 8000.00, 'cashout', 'success', 120.00, 'PG-20260415-000018', '2026-04-15 13:00:00+06'),
  (15, 3, 30000.00, 'transfer', 'success', 0.00, 'PG-20260420-000019', '2026-04-20 09:30:00+06'),
  (3, 4, 1200.00, 'bill', 'success', 0.00, 'PG-20260425-000020', '2026-04-25 15:30:00+06'),
  (1, 2, 4000.00, 'transfer', 'success', 0.00, 'PG-20260501-000021', '2026-05-01 10:00:00+06'),
  (6, 3, 35000.00, 'cashout', 'success', 525.00, 'PG-20260505-000022', '2026-05-05 11:00:00+06'),
  (7, 4, 7500.00, 'transfer', 'success', 0.00, 'PG-20260510-000023', '2026-05-10 14:00:00+06'),
  (13, 1, 22000.00, 'transfer', 'success', 0.00, 'PG-20260515-000024', '2026-05-15 09:00:00+06'),
  (14, 2, 9800.00, 'bill', 'success', 0.00, 'PG-20260520-000025', '2026-05-20 16:00:00+06'),
  (15, 1, 55000.00, 'transfer', 'success', 0.00, 'PG-20260525-000026', '2026-05-25 10:30:00+06'),
  (1, 3, 3000.00, 'transfer', 'success', 0.00, 'PG-20260528-000027', '2026-05-28 09:00:00+06'),
  (1, 4, 4000.00, 'transfer', 'success', 0.00, 'PG-20260528-000028', '2026-05-28 10:00:00+06'),
  (1, 5, 5000.00, 'cashout', 'success', 75.00, 'PG-20260528-000029', '2026-05-28 11:00:00+06'),
  (6, 5, 500.00, 'transfer', 'success', 0.00, 'PG-20260528-000030', '2026-05-28 12:00:00+06'),
  (7, 5, 800.00, 'cashout', 'success', 12.00, 'PG-20260528-000031', '2026-05-28 13:00:00+06'),
  (2, 1, 2000.00, 'transfer', 'success', 0.00, 'PG-20260529-000032', '2026-05-29 08:00:00+06'),
  (2, 3, 3500.00, 'transfer', 'success', 0.00, 'PG-20260529-000033', '2026-05-29 14:00:00+06'),
  (2, 4, 1800.00, 'bill', 'success', 0.00, 'PG-20260530-000034', '2026-05-30 10:00:00+06'),
  (13, 5, 4500.00, 'transfer', 'success', 0.00, 'PG-20260530-000035', '2026-05-30 11:00:00+06'),
  (12, 2, 12000.00, 'transfer', 'success', 0.00, 'PG-20260601-000036', '2026-06-01 03:00:00+06'),
  (6, 1, 90000.00, 'transfer', 'success', 0.00, 'PG-20260601-000037', '2026-06-01 10:00:00+06'),
  (15, 2, 95000.00, 'transfer', 'success', 0.00, 'PG-20260601-000038', '2026-06-01 11:00:00+06'),
  (3, 5, 5000.00, 'transfer', 'failed', 0.00, 'PG-20260601-000039', '2026-06-01 12:00:00+06'),
  (4, 1, 2000.00, 'transfer', 'pending', 0.00, 'PG-20260601-000040', '2026-06-01 13:00:00+06'),
  (5, 8, 1100.00, 'bill', 'success', 0.00, 'PG-20260530-000041', '2026-05-30 14:00:00+06'),
  (4, 8, 800.00, 'bill', 'success', 0.00, 'PG-20260530-000042', '2026-05-30 15:00:00+06'),
  (4, 7, 75000.00, 'cashout', 'flagged', 1125.00, 'PG-20260526-000043', '2026-05-26 15:00:00+06');

INSERT INTO fraud_flags (txn_id, user_id, rule_triggered, risk_score, reviewed_by, flagged_at) VALUES
  (43, 4, 'large_transaction', 85, 3, NOW() - INTERVAL '5 days'),
  (26, 15, 'large_transaction', 40, 3, NOW() - INTERVAL '7 days'),
  (36, 12, 'new_account_activity', 50, NULL, NOW() - INTERVAL '1 day'),
  (36, 12, 'unusual_hours', 75, 3, NOW() - INTERVAL '1 day'),
  (37, 6, 'large_transaction', 90, 3, NOW() - INTERVAL '1 hour'),
  (38, 15, 'large_transaction', 95, NULL, NOW() - INTERVAL '30 minutes');

INSERT INTO bill_payments (txn_id, user_id, company_name, bill_type, account_no, due_date, amount, status, paid_at) VALUES
  (5, 5, 'DESCO', 'ELECTRICITY', 'DESCO-005-001', '2026-01-31', 2500.00, 'SUCCESS', '2026-01-25 16:00:00+06'),
  (10, 4, 'WASA Dhaka', 'WATER', 'WASA-004-001', '2026-02-28', 900.00, 'SUCCESS', '2026-02-25 15:00:00+06'),
  (14, 13, 'Titas Gas', 'GAS', 'TITAS-013-001', '2026-03-31', 6000.00, 'SUCCESS', '2026-03-20 11:00:00+06'),
  (20, 3, 'DESCO', 'ELECTRICITY', 'DESCO-003-001', '2026-04-30', 1200.00, 'SUCCESS', '2026-04-25 15:30:00+06'),
  (25, 14, 'Grameenphone', 'INTERNET', 'GP-014-001', '2026-05-31', 9800.00, 'SUCCESS', '2026-05-20 16:00:00+06'),
  (34, 2, 'DESCO', 'ELECTRICITY', 'DESCO-002-001', '2026-05-31', 1800.00, 'SUCCESS', '2026-05-30 10:00:00+06'),
  (41, 5, 'Robi Axiata', 'MOBILE', 'ROBI-005-001', '2026-05-31', 1100.00, 'SUCCESS', '2026-05-30 14:00:00+06'),
  (42, 4, 'Grameenphone', 'MOBILE', 'GP-004-001', '2026-05-31', 800.00, 'SUCCESS', '2026-05-30 15:00:00+06');

INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at, is_used) VALUES
  (1, '482910', 'login', NOW() + INTERVAL '5 minutes', FALSE),
  (2, '371845', 'transfer', NOW() - INTERVAL '1 hour', TRUE),
  (3, '910234', 'register', NOW() - INTERVAL '2 hours', TRUE),
  (4, '657823', 'login', NOW() - INTERVAL '30 minutes', TRUE),
  (5, '124789', 'transfer', NOW() + INTERVAL '3 minutes', FALSE),
  (12, '998271', 'register', NOW() - INTERVAL '11 hours', TRUE),
  (13, '445612', 'login', NOW() - INTERVAL '3 days', TRUE),
  (6, '772341', 'transfer', NOW() - INTERVAL '4 hours', TRUE);

INSERT INTO reward_points (user_id, current_points, lifetime_earned, lifetime_redeemed, tier, tier_updated_at) VALUES
  (1, 850, 850, 0, 'bronze', NOW() - INTERVAL '180 days'),
  (2, 2800, 3200, 400, 'silver', NOW() - INTERVAL '90 days'),
  (3, 1100, 1200, 100, 'silver', NOW() - INTERVAL '80 days'),
  (4, 450, 450, 0, 'bronze', NOW() - INTERVAL '60 days'),
  (5, 120, 120, 0, 'bronze', NOW() - INTERVAL '40 days'),
  (6, 7200, 9500, 2300, 'gold', NOW() - INTERVAL '30 days'),
  (7, 5100, 6000, 900, 'gold', NOW() - INTERVAL '25 days'),
  (8, 16000, 18000, 2000, 'platinum', NOW() - INTERVAL '60 days'),
  (9, 15500, 15500, 0, 'platinum', NOW() - INTERVAL '120 days'),
  (12, 0, 0, 0, 'bronze', NOW() - INTERVAL '12 hours'),
  (13, 3200, 4800, 1600, 'silver', NOW() - INTERVAL '50 days'),
  (14, 4900, 4900, 0, 'silver', NOW() - INTERVAL '70 days'),
  (15, 6500, 8000, 1500, 'gold', NOW() - INTERVAL '45 days');

INSERT INTO reward_redemptions (user_id, points_used, cashback_amount, conversion_rate, wallet_id, status, redeemed_at) VALUES
  (2, 400, 40.00, 0.1000, 2, 'credited', NOW() - INTERVAL '60 days'),
  (6, 2300, 230.00, 0.1000, 6, 'credited', NOW() - INTERVAL '30 days'),
  (7, 900, 90.00, 0.1000, 7, 'credited', NOW() - INTERVAL '25 days'),
  (8, 2000, 300.00, 0.1500, 8, 'credited', NOW() - INTERVAL '20 days'),
  (13, 1600, 160.00, 0.1000, 13, 'credited', NOW() - INTERVAL '15 days'),
  (3, 100, 10.00, 0.1000, 3, 'credited', NOW() - INTERVAL '10 days'),
  (15, 1500, 150.00, 0.1000, 15, 'credited', NOW() - INTERVAL '5 days'),
  (1, 200, 20.00, 0.1000, 1, 'pending', NOW() - INTERVAL '1 day');

INSERT INTO occasion_cashbacks (occasion_name, occasion_type, cashback_pct, max_cashback, min_txn_amount, eligible_txn_type, start_date, end_date, is_active, created_by) VALUES
  ('Eid ul-Adha 2026', 'eid', 8.00, 150.00, 500.00, 'transfer', '2026-05-28', '2026-06-10', TRUE, 1),
  ('Bangladesh Budget Day', 'other', 3.00, 50.00, 100.00, 'bill', '2026-06-01', '2026-06-07', TRUE, 2),
  ('Eid ul-Fitr 2026', 'eid', 10.00, 200.00, 500.00, 'transfer', '2026-03-28', '2026-04-05', FALSE, 1),
  ('Bengali New Year 2026', 'new_year', 5.00, 75.00, 200.00, 'all', '2026-04-14', '2026-04-20', FALSE, 2),
  ('Independence Day 2026', 'independence', 3.00, 50.00, 100.00, 'all', '2026-03-26', '2026-03-27', FALSE, 1),
  ('Eid ul-Adha Bonus', 'eid', 5.00, 100.00, 300.00, 'cashout', '2026-06-15', '2026-06-25', TRUE, 2);

INSERT INTO favorite_contacts (owner_user_id, contact_user_id, nickname, free_cashout, total_txn) VALUES
  (1, 2, 'Fatema Apu', TRUE, 8),
  (1, 3, 'Nasreen Bon', TRUE, 3),
  (1, 4, 'Jubayer Bhai', TRUE, 2),
  (2, 3, 'Nasreen', TRUE, 5),
  (2, 1, 'Rafiq Bhai', TRUE, 4),
  (3, 4, 'Jubayer', TRUE, 2),
  (3, 1, 'Rafiq Sir', TRUE, 3),
  (6, 1, 'Customer Rafiq', TRUE, 6),
  (13, 2, 'Fatema', TRUE, 3),
  (14, 3, 'Nasreen', FALSE, 1);

INSERT INTO audit_logs (admin_id, action, target_table, target_id, old_value, new_value) VALUES
  (1, 'UPDATE_USER_STATUS', 'users', 4, '{"is_verified": false}', '{"is_verified": true}'),
  (3, 'REVIEW_FRAUD_FLAG', 'fraud_flags', 1, '{"reviewed_by": null}', '{"reviewed_by": 3}'),
  (2, 'UPDATE_WALLET_LIMIT', 'transaction_limits', 12, '{"daily_limit": 25000}', '{"daily_limit": 50000}'),
  (1, 'DEACTIVATE_WALLET', 'wallets', 11, '{"is_active": true}', '{"is_active": false}'),
  (3, 'REVIEW_FRAUD_FLAG', 'fraud_flags', 5, '{"reviewed_by": null}', '{"reviewed_by": 3}'),
  (4, 'RESET_PASSWORD', 'users', 5, '{"note": "old hash"}', '{"note": "new hash"}'),
  (1, 'CREATE_OCCASION', 'occasion_cashbacks', 1, NULL, '{"occasion_name": "Eid ul-Adha 2026"}');

INSERT INTO notifications (user_id, message, notif_type, is_read) VALUES
  (1, 'BDT 5,000 transferred to Fatema Begum. Ref: PG-20260101-000001', 'in_app', TRUE),
  (2, 'You received BDT 5,000 from Rafiq Ahmed.', 'in_app', TRUE),
  (4, 'Your transaction BDT 75,000 has been flagged for review.', 'sms', FALSE),
  (12, 'Your account has been created. Welcome to PoishaGo!', 'email', TRUE),
  (12, 'Unusual activity detected on your account.', 'sms', FALSE),
  (1, 'Keep transacting to reach Silver tier and earn 1.25x points!', 'in_app', FALSE),
  (6, 'Congratulations! You have reached GOLD tier. Enjoy 1.5x points.', 'in_app', TRUE),
  (8, 'PLATINUM achieved! Enjoy 2x points and BDT 0.15 per point.', 'email', TRUE),
  (2, 'BDT 40 cashback credited to your wallet from reward redemption.', 'in_app', TRUE),
  (15, 'Large transaction alert: BDT 95,000 transfer recorded.', 'sms', FALSE);

create view vw_active_wallets as 
	select 
		u.user_id,
		u.full_name,
		u.phone,
		u.user_type,
		w.wallet_number,
		w.balance,
		w.currency,
		rp.current_points,
		rp.tier,
		(select count(*)
		 from transactions t 
		 where t.sender_wallet_id = w.wallet_id
		 and t.status = 'success') as total_sent_txns,
		 (select COALESCE(sum(t.amount),0)
		 from transactions t 
		 where t.sender_wallet_id=w.wallet_id
		 and t.status='success') as total_sent_amount
from users u 
	join wallets w on u.user_id=w.user_id
	left join reward_points rp on u.user_id=rp.user_id
	where w.is_active=true and u.is_verified=true;

create view vw_fraud_dashboard as 
	select 
		ff.flag_id,
		u.full_name as flagged_user,
		u.phone,
		t.reference_no,
		t.amount,
		t.txn_type,
		ff.rule_triggered,
		ff.risk_score,
		ff.flagged_at,
		adm_user.full_name as reviewed_by_name
from fraud_flags ff 
join users u on ff.user_id=u.user_id
join transactions t on ff.txn_id=t.txn_id
left join admins a on ff.reviewed_by=a.admin_id
left join users adm_user on a.user_id=adm_user.user_id
order by ff.risk_score desc,ff.flagged_at desc;

INSERT INTO reward_options (title, points_required, value_bdt, category) VALUES
    ('৳50 Wallet Cashback', 500, 50.0, 'cashback'),
    ('৳100 Wallet Cashback', 1000, 100.0, 'cashback'),
    ('৳200 Daraz Voucher', 2000, 200.0, 'voucher'),
    ('৳500 Wallet Cashback', 5000, 500.0, 'cashback');

CREATE TABLE bill_categories (
    id VARCHAR(50) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    icon_id VARCHAR(50) NOT NULL,
    color VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO bill_categories (id, label, icon_id, color) VALUES
    ('electricity', 'Electricity', 'Zap', 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'),
    ('water', 'Water Bill', 'Droplet', 'text-blue-400 bg-blue-500/10 border-blue-500/20'),
    ('gas', 'Gas', 'Flame', 'text-orange-400 bg-orange-500/10 border-orange-500/20'),
    ('internet', 'Internet', 'Globe', 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'),
    ('education', 'Education', 'BookOpen', 'text-green-400 bg-green-500/10 border-green-500/20'),
    ('tv', 'Cable TV', 'Tv', 'text-purple-400 bg-purple-500/10 border-purple-500/20');
