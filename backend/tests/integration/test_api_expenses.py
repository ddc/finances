import pytest

pytestmark = [pytest.mark.django_db, pytest.mark.integration]

BASE_URL = "/api/v1/expenses"


class TestExpenseCRUD:
    def test_create_expense_as_admin(self, admin_client):
        response = admin_client.post(
            f"{BASE_URL}/",
            {"expense_date": "2026-01-05", "category": "IMPOSTOS", "amount": "4380.59", "description": "Tax payment"},
        )
        assert response.status_code == 201
        assert response.data["category"] == "IMPOSTOS"
        assert response.data["created_by"] is not None

    def test_create_expense_as_viewer_denied(self, viewer_client):
        response = viewer_client.post(
            f"{BASE_URL}/", {"expense_date": "2026-01-10", "category": "IMPOSTOS", "amount": "100.00"}
        )
        assert response.status_code == 403

    def test_list_expenses(self, admin_client):
        admin_client.post(f"{BASE_URL}/", {"expense_date": "2026-01-10", "category": "IMPOSTOS", "amount": "100.00"})
        response = admin_client.get(f"{BASE_URL}/")
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_update_expense_as_admin(self, admin_client):
        create = admin_client.post(
            f"{BASE_URL}/", {"expense_date": "2026-01-10", "category": "IMPOSTOS", "amount": "100.00"}
        )
        expense_id = create.data["id"]
        response = admin_client.put(
            f"{BASE_URL}/{expense_id}/", {"expense_date": "2026-01-15", "category": "PLANO_SAUDE", "amount": "889.64"}
        )
        assert response.status_code == 200
        assert response.data["category"] == "PLANO_SAUDE"

    def test_delete_expense_as_admin(self, admin_client):
        create = admin_client.post(
            f"{BASE_URL}/", {"expense_date": "2026-01-20", "category": "OTHER", "amount": "50.00"}
        )
        expense_id = create.data["id"]
        response = admin_client.delete(f"{BASE_URL}/{expense_id}/")
        assert response.status_code == 204

    def test_viewer_can_list_expenses(self, admin_client, viewer_client):
        admin_client.post(f"{BASE_URL}/", {"expense_date": "2026-01-10", "category": "IMPOSTOS", "amount": "100.00"})
        response = viewer_client.get(f"{BASE_URL}/")
        assert response.status_code == 200
