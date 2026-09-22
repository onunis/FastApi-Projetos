
from fastapi import HTTPException
from jose import jwt
from datetime import timedelta
from .utils import *
from routers.auth import (
    get_db,
    authenticated_user,
    get_current_user,
    create_access_token,
    SECRET_KEY,
    ALGORITHM
    )

app.dependency_overrides[get_db] = override_get_db


def test_authenticate_user(test_user):

    db = TestingSessionLocal()

    authenticate_user = authenticated_user(
        test_user.username,
        "testpassword",
        db
    )

    assert authenticate_user is not None
    assert authenticate_user.username == test_user.username

    non_existent_user = authenticated_user(
        "WrongUserName",
        "testpassword",
        db
    )

    assert non_existent_user is False

    user_with_wrong_password = authenticated_user(
        test_user.username,
        "wrongpassword",
        db
    )

    assert user_with_wrong_password is False


def test_create_access_token():
    username = "testuser"
    user_id = 1
    role = "admin"
    expire_delta = timedelta(days=1)

    token = create_access_token(
        username,
        user_id,
        role,
        expire_delta
    )

    decoded_token = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
        options={"verify_signature": False}
    )

    assert decoded_token["sub"] == username
    assert decoded_token["id"] == user_id
    assert decoded_token["role"] == role


@pytest.mark.asyncio
async def test_get_current_user_valid_token():
    encode = {
        "sub": "testuser",
        "id": 1,
        "role": "admin"

    }

    token = jwt.encode(
        encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    user = await get_current_user(token=token)

    assert user ==  {
        "username": "testuser",
        "id": 1,
        "user_role": "admin"
    }


@pytest.mark.asyncio
async def test_get_current_user_missing_payload():
    encode = {
        "role":"user"
    }

    token = jwt.encode(
        encode,
        SECRET_KEY,
        algorithm=ALGORITHM        
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(token=token)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Could not validate user."

