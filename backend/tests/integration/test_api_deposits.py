import pytest

pytestmark = [pytest.mark.django_db, pytest.mark.integration]

BASE_URL = "/api/v1/deposits"


def _valid_deposit(currency, company):
    return {
        "deposit_date": "2026-01-02",
        "company": str(company.id),
        "invoice_number": "INV-001",
        "invoice_issue_date": "2025-12-26",
        "period_start": "2025-12-21",
        "period_end": "2025-12-27",
        "currency": str(currency.id),
        "amount_foreign": "1115.00",
        "amount_brl": "5894.49",
    }


class TestDepositCRUD:
    def test_create_deposit_as_admin(self, admin_client, currency, company):
        response = admin_client.post(f"{BASE_URL}/", _valid_deposit(currency, company))
        assert response.status_code == 201

    def test_create_deposit_as_viewer_denied(self, viewer_client, currency, company):
        response = viewer_client.post(f"{BASE_URL}/", _valid_deposit(currency, company))
        assert response.status_code == 403

    def test_list_deposits(self, admin_client, currency, company):
        admin_client.post(f"{BASE_URL}/", _valid_deposit(currency, company))
        response = admin_client.get(f"{BASE_URL}/")
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_delete_deposit(self, admin_client, currency, company):
        create = admin_client.post(f"{BASE_URL}/", _valid_deposit(currency, company))
        response = admin_client.delete(f"{BASE_URL}/{create.data['id']}/")
        assert response.status_code == 204
