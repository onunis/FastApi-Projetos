from typing import Annotated
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import models
from models import Todos
from database import engine, SessionLocal

app = FastAPI()

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

dp_dependency = Annotated[Session, Depends(get_db)]

@app.get("/")
async def read_all(db: dp_dependency):
    return db.query(Todos).all()

