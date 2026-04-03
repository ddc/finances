import pytest

pytestmark = [pytest.mark.django_db, pytest.mark.integration]

DEPOSIT_URL = "/api/v1/deposits"
TRANSFER_URL = "/api/v1/transfers"


class TestTransferCRUD:
    def _create_deposit(self, client):
        response = client.post(
            f"{DEPOSIT_URL}/",
            {
                "deposit_date": "2026-01-02",
                "invoice_number": "INV-001",
                "invoice_issue_date": "2025-12-26",
                "period_start": "2025-12-21",
                "period_end": "2025-12-27",
                "amount_foreign": "1115.00",
                "amount_brl": "5894.49",
            },
        )
        return response.data["id"]

    def test_create_transfer_as_admin(self, admin_client):
        deposit_id = self._create_deposit(admin_client)
        response = admin_client.post(
            f"{TRANSFER_URL}/",
            {
                "transfer_date": "2026-01-02",
                "deposit": deposit_id,
                "bank_name": "SANTANDER",
                "amount_brl": "5890.00",
            },
        )
        assert response.status_code == 201

    def test_create_transfer_as_viewer_denied(self, admin_client, viewer_client):
        deposit_id = self._create_deposit(admin_client)
        response = viewer_client.post(
            f"{TRANSFER_URL}/",
            {
                "transfer_date": "2026-01-02",
                "deposit": deposit_id,
                "bank_name": "SANTANDER",
                "amount_brl": "5890.00",
            },
        )
        assert response.status_code == 403

    def test_list_transfers(self, admin_client):
        deposit_id = self._create_deposit(admin_client)
        admin_client.post(
            f"{TRANSFER_URL}/",
            {
                "transfer_date": "2026-01-02",
                "deposit": deposit_id,
                "bank_name": "SANTANDER",
                "amount_brl": "5890.00",
            },
        )
        response = admin_client.get(f"{TRANSFER_URL}/")
        assert response.status_code == 200
        assert len(response.data) >= 1
