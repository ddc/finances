import pytest
from tests.conftest import TEST_USER_PASSWORD

pytestmark = [pytest.mark.django_db, pytest.mark.integration]

BASE_URL = "/api/v1/auth"


class TestLogin:
    def test_login_success(self, admin_user):
        from rest_framework.test import APIClient

        client = APIClient()
        response = client.post(f"{BASE_URL}/login/", {"username": "admin", "password": TEST_USER_PASSWORD})
        assert response.status_code == 200
        assert "token" in response.data
        assert response.data["user"]["role"] == "admin"

    def test_login_invalid_credentials(self):
        from rest_framework.test import APIClient

        client = APIClient()
        response = client.post(f"{BASE_URL}/login/", {"username": "wrong", "password": TEST_USER_PASSWORD + "-invalid"})
        assert response.status_code == 401

    def test_me(self, admin_client):
        response = admin_client.get(f"{BASE_URL}/me/")
        assert response.status_code == 200
        assert response.data["username"] == "admin"

    def test_logout(self, admin_client):
        response = admin_client.post(f"{BASE_URL}/logout/")
        assert response.status_code == 204
