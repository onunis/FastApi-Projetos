from fastapi import status

from .utils import *
from routers.admin import get_current_user, get_db


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = get_current_user


def test_admin_real_all_authenticated(test_todo):
    response = client.get("/admin/todo")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [{
            'title': "Learn to code!",
            'description': "Need to learn everyday!",
            'priority':5,
            'complete': False,
            'id':1,
            'owner_id':1
            }
    ]