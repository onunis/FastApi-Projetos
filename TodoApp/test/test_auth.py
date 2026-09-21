from .utils import *
from routers.auth import get_db, authenticated_user

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
