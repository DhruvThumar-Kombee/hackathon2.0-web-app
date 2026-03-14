from app.database import SessionLocal
from app.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()
try:
    if not db.query(User).filter(User.email == "admin@kombee.com").first():
        admin_user = User(
            email="admin@kombee.com",
            username="admin",
            hashed_password=pwd_context.hash("admin123"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        print("User admin@kombee.com created")
    else:
        print("User admin@kombee.com already exists")
finally:
    db.close()
