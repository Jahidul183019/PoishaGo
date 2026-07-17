import os
import sys
import argparse
import psycopg2
from passlib.context import CryptContext
from dotenv import load_dotenv

def main():
    parser = argparse.ArgumentParser(description="Reset user password in PoishaGo database.")
    parser.add_argument("password", help="The new password to set")
    parser.add_argument("--phone", help="Phone number of the user to update")
    parser.add_argument("--email", help="Email of the user to update")
    parser.add_argument("--all", action="store_true", help="Update ALL users (use with caution)")
    
    args = parser.parse_args()

    if not (args.phone or args.email or args.all):
        print("Error: You must specify a target using --phone, --email, or --all.")
        sys.exit(1)

    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL environment variable not set in .env")
        sys.exit(1)

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=4)
    hashed_password = pwd_context.hash(args.password)

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()

        if args.all:
            confirm = input("WARNING: You are about to update the password for ALL users. Are you sure? [y/N]: ")
            if confirm.lower() != 'y':
                print("Operation cancelled.")
                sys.exit(0)
            cur.execute("UPDATE users SET password_hash = %s", (hashed_password,))
            print(f"Updated {cur.rowcount} users with the new password.")
        elif args.phone:
            cur.execute("UPDATE users SET password_hash = %s WHERE phone = %s", (hashed_password, args.phone))
            if cur.rowcount == 0:
                print(f"No user found with phone: {args.phone}")
            else:
                print(f"Updated password for user with phone: {args.phone}")
        elif args.email:
            cur.execute("UPDATE users SET password_hash = %s WHERE email = %s", (hashed_password, args.email))
            if cur.rowcount == 0:
                print(f"No user found with email: {args.email}")
            else:
                print(f"Updated password for user with email: {args.email}")

        conn.commit()
    except Exception as e:
        print(f"Database error: {e}")
    finally:
        if 'cur' in locals() and cur:
            cur.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    main()
