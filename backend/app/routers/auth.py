from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from opentelemetry import trace
from passlib.context import CryptContext
from jose import jwt
import logging, os
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr

from ..database import get_db
from ..models import User

router = APIRouter()
tracer = trace.get_tracer(__name__)
logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey123")

def create_token(data: dict):
    data.update({"exp": datetime.utcnow() + timedelta(hours=24)})
    return jwt.encode(data, SECRET_KEY, algorithm="HS256")

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(req: UserRegister, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("auth.register") as span:
        email, username, password = req.email, req.username, req.password
        span.set_attribute("user.email", email)

        with tracer.start_as_current_span("auth.validate_input"):
            if len(password) < 6:
                logger.warning("REGISTER_VALIDATION_FAILED", extra={"reason": "password_too_short"})
                raise HTTPException(status_code=422, detail="Password too short")

        with tracer.start_as_current_span("auth.check_existing_user"):
            existing = db.query(User).filter(
                (User.email == email) | (User.username == username)
            ).first()

        if existing:
            logger.warning("REGISTER_FAILED_DUPLICATE", extra={"email": email})
            raise HTTPException(status_code=400, detail="Email or username already exists")

        with tracer.start_as_current_span("auth.hash_password"):
            hashed = pwd_context.hash(password)

        with tracer.start_as_current_span("auth.db_insert"):
            try:
                user = User(email=email, username=username, hashed_password=hashed)
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info("USER_REGISTERED", extra={"user_id": user.id, "email": email})
                span.set_attribute("user.id", user.id)
                return {"message": "Registered successfully", "user_id": user.id}
            except Exception as e:
                db.rollback()
                err_msg = str(e).lower()
                # Handle unique constraint violations (SQLite + PostgreSQL)
                if "unique" in err_msg or "duplicate" in err_msg:
                    logger.warning("REGISTER_FAILED_DUPLICATE_DB", extra={"email": email})
                    raise HTTPException(status_code=400, detail="Email or username already exists")
                logger.error("REGISTRATION_DB_ERROR", extra={"error": str(e), "email": email})
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/login")
def login(req: UserLogin, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("auth.login") as span:
        email, password = req.email, req.password
        span.set_attribute("user.email", email)

        with tracer.start_as_current_span("auth.fetch_user_from_db"):
            user = db.query(User).filter(User.email == email).first()

        with tracer.start_as_current_span("auth.verify_password"):
            valid = user and pwd_context.verify(password, user.hashed_password)

        if not valid:
            logger.warning("LOGIN_FAILED", extra={"email": email, "reason": "invalid_credentials"})
            span.set_attribute("login.success", False)
            raise HTTPException(status_code=401, detail="Invalid credentials")

        with tracer.start_as_current_span("auth.generate_token"):
            token = create_token({"sub": str(user.id), "role": user.role})

        logger.info("LOGIN_SUCCESS", extra={"user_id": user.id, "email": email})
        span.set_attribute("login.success", True)
        span.set_attribute("user.id", user.id)
        return {"access_token": token, "token_type": "bearer"}
