from fastapi import status
from .utils import *
from routers.users import get_db, get_current_user

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

def test_return_user(test_user):
    response = client.get("/users")

    assert response.status_code == status.HTTP_200_OK

    assert response.json()["username"] == "drakezinho"
    assert response.json()["email"] == "drakezin@email.com"
    assert response.json()["first_name"] == "Guilherme"
    assert response.json()["last_name"] == "Nunes"
    assert response.json()["role"] == "admin"
    assert response.json()["phone_number"] == "11111111"


def test_change_password_success(test_user):
    response = client.put(
        "/users/password", json={
            "password":"testpassword",
            "new_password":"newpassword"
        }
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT

