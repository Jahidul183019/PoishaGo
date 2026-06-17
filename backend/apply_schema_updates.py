import sys
from sqlalchemy import text
from database import SessionLocal

def main():
    db = SessionLocal()
    try:
        print("Applying schema updates...")
        with db.connection().engine.connect() as conn:
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS promotional_banners (
                banner_id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                action_text VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE
            );

            CREATE TABLE IF NOT EXISTS bill_providers (
                provider_id SERIAL PRIMARY KEY,
                category VARCHAR(50) REFERENCES bill_categories(id),
                name VARCHAR(255) NOT NULL
            );

            INSERT INTO promotional_banners (title, description, action_text) VALUES 
            ('Eid-Ul-Adha Special Cashback Promo!', 'Send ৳1,000+ today & stand a chance of earning an instant ৳500 double cashback in your wallet!', NULL)
            ON CONFLICT DO NOTHING;
            
            INSERT INTO bill_providers (category, name) VALUES 
            ('electricity', 'DESCO (Dhaka Electricity Supply)'),
            ('electricity', 'DPDC (Dhaka Power)'),
            ('electricity', 'NESCO (Northern Electricity)'),
            ('water', 'Dhaka WASA'),
            ('water', 'Chittagong WASA'),
            ('water', 'Khulna WASA'),
            ('gas', 'Titas Gas Transmission'),
            ('gas', 'Jalalabad Gas Co.'),
            ('gas', 'Bakhrabad Gas'),
            ('internet', 'Link3 Broadband'),
            ('internet', 'Carnival Internet'),
            ('internet', 'Amber IT'),
            ('education', 'Dhaka University (DU)'),
            ('education', 'BUET'),
            ('education', 'North South University (NSU)'),
            ('tv', 'Akash DTH Bangladesh'),
            ('tv', 'Bengal Digital Cable TV')
            ON CONFLICT DO NOTHING;
            """))
            conn.commit()
            print("Schema updates applied successfully.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
