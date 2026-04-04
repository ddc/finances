import pytest
from core.models import ExpenseCategory

pytestmark = [pytest.mark.django_db, pytest.mark.integration]

BASE_URL = "/api/v1/expenses"


class TestExpenseCRUD:
    def test_create_expense_as_admin(self, admin_client, expense_category):
        response = admin_client.post(
            f"{BASE_URL}/",
            {
                "expense_date": "2026-01-05",
                "category": str(expense_category.id),
                "amount": "4380.59",
                "description": "Tax payment",
            },
        )
        assert response.status_code == 201
        assert response.data["category_code"] == "TAXES"
        assert response.data["created_by"] is not None

    def test_create_expense_as_viewer_denied(self, viewer_client, expense_category):
        response = viewer_client.post(
            f"{BASE_URL}/",
            {"expense_date": "2026-01-10", "category": str(expense_category.id), "amount": "100.00"},
        )
        assert response.status_code == 403

    def test_list_expenses(self, admin_client, expense_category):
        admin_client.post(
            f"{BASE_URL}/",
            {"expense_date": "2026-01-10", "category": str(expense_category.id), "amount": "100.00"},
        )
        response = admin_client.get(f"{BASE_URL}/")
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_update_expense_as_admin(self, admin_client, expense_category):
        create = admin_client.post(
            f"{BASE_URL}/",
            {"expense_date": "2026-01-10", "category": str(expense_category.id), "amount": "100.00"},
        )
        expense_id = create.data["id"]
        health_category = ExpenseCategory.objects.create(code="HEALTH_INSURANCE", label="Health Insurance")
        response = admin_client.put(
            f"{BASE_URL}/{expense_id}/",
            {
                "expense_date": "2026-01-15",
                "category": str(health_category.id),
                "amount": "889.64",
            },
        )
        assert response.status_code == 200
        assert response.data["category_code"] == "HEALTH_INSURANCE"

    def test_delete_expense_as_admin(self, admin_client, expense_category):
        create = admin_client.post(
            f"{BASE_URL}/",
            {"expense_date": "2026-01-20", "category": str(expense_category.id), "amount": "50.00"},
        )
        expense_id = create.data["id"]
        response = admin_client.delete(f"{BASE_URL}/{expense_id}/")
        assert response.status_code == 204

    def test_viewer_can_list_expenses(self, admin_client, viewer_client, expense_category):
        admin_client.post(
            f"{BASE_URL}/",
            {"expense_date": "2026-01-10", "category": str(expense_category.id), "amount": "100.00"},
        )
        response = viewer_client.get(f"{BASE_URL}/")
        assert response.status_code == 200
