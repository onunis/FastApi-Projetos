from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from pydantic import BaseModel
from models import Users
from passlib.context import CryptContext



router = APIRouter()

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



db_dependency = Annotated[Session, Depends(get_db)]

class CreateUserRequest(BaseModel):

    username: str
    email: str
    first_name: str
    last_name: str
    password: str
    role: str


@router.post("/auth")
async def create_user(create_user_request: CreateUserRequest):
    create_user_model = Users(

    username=create_user_request.username,
    email=create_user_request.email,
    first_name=create_user_request.first_name,
    last_name=create_user_request.last_name,
    hashed_password=bcrypt_context.hash(create_user_request.password),
    role=create_user_request.role,
    is_active=True,
     
    )

    return create_user_model
