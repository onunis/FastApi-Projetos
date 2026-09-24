"""Render entry point: existing API under /api and an explicit static allowlist."""
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from sqlalchemy import inspect

# Validate cloud configuration before importing database.py (which loads .env).
if not os.environ.get("SQLALCHEMY_URL", "").startswith("postgresql://"):
    raise RuntimeError("Configure SQLALCHEMY_URL with the online PostgreSQL URL.")
if len(os.environ.get("SECRET_KEY", "")) < 32:
    raise RuntimeError("Configure SECRET_KEY with at least 32 random characters.")

from database import Base, engine
import models
from routers import auth, todos, admin, users

FRONTEND = Path(__file__).resolve().parent / "frontend"


@asynccontextmanager
async def lifespan(app):
    # A new online database starts empty. Never run the historical incremental
    # migrations against it, nor silently alter an existing database.
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if not tables:
        Base.metadata.create_all(engine)
    else:
        for table in Base.metadata.sorted_tables:
            if table.name not in tables:
                raise RuntimeError("Incomplete online schema; initialization stopped.")
            columns = {column["name"] for column in inspector.get_columns(table.name)}
            if not set(table.columns.keys()).issubset(columns):
                raise RuntimeError("Outdated online schema; initialization stopped.")
    yield


app = FastAPI(lifespan=lifespan)
api = FastAPI()
for router in (auth.router, todos.router, admin.router, users.router):
    api.include_router(router)
app.mount("/api", api)


@app.get("/healthy")
def healthy():
    return {"status": "Healthy"}


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(FRONTEND / "index.html", headers={"Cache-Control": "no-cache"})


def asset(filename):
    def serve():
        return FileResponse(FRONTEND / filename, headers={"Cache-Control": "no-cache"})
    return serve


for filename in ("styles.css", "app.js", "api.js"):
    app.add_api_route("/" + filename, asset(filename), include_in_schema=False)
