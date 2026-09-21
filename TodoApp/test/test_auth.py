from .utils import *
from routers.auth import get_db, authenticated_user

app.dependency_overrides[get_db] = override_get_db

