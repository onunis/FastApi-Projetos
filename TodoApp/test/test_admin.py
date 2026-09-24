from fastapi import status

from .utils import *
from routers.admin import get_current_user, get_db


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = get_current_user


def test_admin_real_all_authenticated(test_todo):
    response = client.get("/admin/todo")

    assert response.status_code == status.HTTP_200_OK
    todos = response.json()

    assert len(todos) == 1

    todo = todos[0]

    assert todo['title'] == "Learn to code!"
    assert todo['description'] == "Need to learn everyday!"
    assert todo['priority'] == 5
    assert todo['status'] == 'todo'
    assert todo['id'] == 1
    assert todo['owner_id'] == 1
    assert todo['created_at'] is not None
    assert todo['updated_at'] is not None


def test_admin_delete_todo(test_todo):
    response = client.delete("/admin/todo/1")

    assert response.status_code == status.HTTP_204_NO_CONTENT

    db = TestingSessionLocal()
    model = db.query(Todos).filter(Todos.id == 1).first()

    assert model is None


def test_admin_delete_todo_not_found():
    response = client.delete("/admin/todo/999")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail":"Todo not found"}

