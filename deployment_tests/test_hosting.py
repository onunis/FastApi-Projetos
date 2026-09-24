"""Run separately: python -m unittest discover -s deployment_tests."""
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import create_engine, text
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "TodoApp"))
os.environ["SQLALCHEMY_URL"] = "postgresql://unused:unused@localhost/unused"
os.environ["SECRET_KEY"] = "isolated-hosting-test-key-not-for-production"
test_engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
with patch("sqlalchemy.create_engine", return_value=test_engine):
    import hosting


class HostingTest(unittest.TestCase):
    def setUp(self):
        hosting.Base.metadata.drop_all(test_engine)

    def test_full_flow_and_static_boundaries(self):
        with TestClient(hosting.app) as client:
            self.assertEqual(client.get("/").status_code, 200)
            self.assertIn("Meu quadro", client.get("/").text)
            for path in ("/app.js", "/api.js", "/styles.css", "/healthy"):
                self.assertEqual(client.get(path).status_code, 200)
            for path in ("/.env", "/database.py", "/server.mjs", "/test/test_auth.py"):
                self.assertEqual(client.get(path).status_code, 404)
            self.assertEqual(client.get("/api/").status_code, 401)
            account = dict(username="deploy-test", email="test@example.com", first_name="Test", last_name="User", password="only-test-password", phone_number="")
            self.assertEqual(client.post("/api/auth/", json=account).status_code, 201)
            response = client.post("/api/auth/token", data={"username": account["username"], "password": account["password"]})
            self.assertEqual(response.status_code, 200)
            client.headers["Authorization"] = "Bearer " + response.json()["access_token"]
            task = dict(title="Teste deploy", description="Tarefa de teste", priority=3)
            self.assertEqual(client.post("/api/todo", json=task).status_code, 201)
            task_id = client.get("/api/").json()[0]["id"]
            self.assertEqual(client.patch(f"/api/todo/{task_id}/status", json={"status": "in_progress"}).status_code, 204)
            self.assertEqual(client.put(f"/api/todo/{task_id}", json={**task, "title": "Editado"}).status_code, 204)
            self.assertEqual(client.get("/api/").json()[0]["status"], "in_progress")
            self.assertEqual(client.delete(f"/api/todo/{task_id}").status_code, 204)
            self.assertEqual(client.get("/api/").json(), [])
        # A second startup must preserve the account.
        with TestClient(hosting.app) as client:
            self.assertEqual(client.post("/api/auth/token", data={"username": account["username"], "password": account["password"]}).status_code, 200)

    def test_partial_database_is_not_modified(self):
        with test_engine.begin() as connection:
            connection.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY)"))
        with self.assertRaisesRegex(RuntimeError, "schema"):
            with TestClient(hosting.app):
                pass
        with test_engine.connect() as connection:
            self.assertEqual(len(connection.execute(text("PRAGMA table_info(users)")).all()), 1)


if __name__ == "__main__":
    unittest.main()
