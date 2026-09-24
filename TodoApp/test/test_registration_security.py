"""Exercise public registration and real JWT authorization in an isolated database."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models import Base, Users, Todos
from routers import auth, admin


@pytest.fixture
def registration_client():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)

    def isolated_db():
        with sessions() as db:
            yield db

    application = FastAPI()
    application.include_router(auth.router)
    application.include_router(admin.router)
    application.dependency_overrides[auth.get_db] = isolated_db
    application.dependency_overrides[admin.get_db] = isolated_db
    with TestClient(application) as client:
        yield client, sessions
    engine.dispose()


@pytest.mark.parametrize("requested_role", [None, "user", "admin", "ADMIN"])
def test_public_registration_cannot_grant_admin(registration_client, requested_role):
    client, sessions = registration_client
    payload = {
        "username": "new-user",
        "email": "new-user@example.test",
        "first_name": "Test",
        "last_name": "User",
        "password": "local-test-password",
        "phone_number": "11111111",
    }
    if requested_role is not None:
        payload["role"] = requested_role

    assert client.post("/auth/", json=payload).status_code == 201
    with sessions() as db:
        user = db.query(Users).filter_by(username="new-user").one()
        assert user.role == "user"
        assert user.hashed_password != payload["password"]
        task = Todos(title="Protected task", description="Must remain", priority=1, owner_id=user.id)
        db.add(task)
        db.commit()
        task_id = task.id

    login = client.post("/auth/token", data={"username": payload["username"], "password": payload["password"]})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    assert client.get("/admin/todo", headers=headers).status_code == 401
    assert client.delete(f"/admin/todo/{task_id}", headers=headers).status_code == 401
    with sessions() as db:
        assert db.get(Todos, task_id) is not None


def test_existing_admin_keeps_access(registration_client):
    client, sessions = registration_client
    with sessions() as db:
        db.add(Users(username="existing-admin", role="admin", hashed_password=auth.bcrypt_context.hash("existing-password")))
        db.commit()
    login = client.post("/auth/token", data={"username": "existing-admin", "password": "existing-password"})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    assert client.get("/admin/todo", headers=headers).status_code == 200
    with sessions() as db:
        assert db.query(Users).filter_by(username="existing-admin").one().role == "admin"
