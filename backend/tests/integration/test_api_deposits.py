import pytest

pytestmark = [pytest.mark.django_db, pytest.mark.integration]

BASE_URL = "/api/v1/deposits"

VALID_DEPOSIT = {
    "deposit_date": "2026-01-02",
    "invoice_number": "INV-001",
    "invoice_issue_date": "2025-12-26",
    "period_start": "2025-12-21",
    "period_end": "2025-12-27",
    "amount_usd": "1115.00",
    "amount_brl": "5894.49",
}


class TestDepositCRUD:
    def test_create_deposit_as_admin(self, admin_client):
        response = admin_client.post(f"{BASE_URL}/", VALID_DEPOSIT)
        assert response.status_code == 201

    def test_create_deposit_as_viewer_denied(self, viewer_client):
        response = viewer_client.post(f"{BASE_URL}/", VALID_DEPOSIT)
        assert response.status_code == 403

    def test_list_deposits(self, admin_client):
        admin_client.post(f"{BASE_URL}/", VALID_DEPOSIT)
        response = admin_client.get(f"{BASE_URL}/")
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_delete_deposit(self, admin_client):
        create = admin_client.post(f"{BASE_URL}/", VALID_DEPOSIT)
        response = admin_client.delete(f"{BASE_URL}/{create.data['id']}/")
        assert response.status_code == 204
