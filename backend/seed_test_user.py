from app.database import SessionLocal
from app.models import User
from passlib.context import CryptContext
import sys

# Provided credentials
EMAIL = "test@test.com"
PASSWORD = "test123"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

try:
    user = db.query(User).filter(User.email == EMAIL).first()
    if not user:
        new_user = User(
            email=EMAIL,
            username="test_user",
            hashed_password=pwd_context.hash(PASSWORD),
            role="admin" # Giving admin role to see more dashboards if applicable
        )
        db.add(new_user)
        db.commit()
        print(f"User {EMAIL} created successfully.")
    else:
        # Update password if user exists to ensure it's test123
        user.hashed_password = pwd_context.hash(PASSWORD)
        db.commit()
        print(f"User {EMAIL} already exists, password updated.")
finally:
    db.close()
