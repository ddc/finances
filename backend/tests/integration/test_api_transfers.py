import io
import pytest

pytestmark = [pytest.mark.django_db, pytest.mark.integration]

DEPOSIT_URL = "/api/v1/deposits"
TRANSFER_URL = "/api/v1/transfers"


class TestTransferCRUD:
    @staticmethod
    def _create_deposit(client, currency, company):
        response = client.post(
            f"{DEPOSIT_URL}/",
            {
                "deposit_date": "2026-01-02",
                "company": str(company.id),
                "invoice_number": "INV-001",
                "period_start": "2025-12-21",
                "period_end": "2025-12-27",
                "currency": str(currency.id),
                "amount_foreign": "1115.00",
                "amount_brl": "5894.49",
            },
        )
        return response.data["id"]

    def test_create_transfer_as_admin(self, admin_client, currency, company, bank):
        deposit_id = self._create_deposit(admin_client, currency, company)
        response = admin_client.post(
            f"{TRANSFER_URL}/",
            {
                "transfer_date": "2026-01-02",
                "deposit": deposit_id,
                "bank": str(bank.id),
                "amount_brl": "5890.00",
            },
        )
        assert response.status_code == 201

    def test_create_transfer_as_viewer_denied(self, admin_client, viewer_client, currency, company, bank):
        deposit_id = self._create_deposit(admin_client, currency, company)
        response = viewer_client.post(
            f"{TRANSFER_URL}/",
            {
                "transfer_date": "2026-01-02",
                "deposit": deposit_id,
                "bank": str(bank.id),
                "amount_brl": "5890.00",
            },
        )
        assert response.status_code == 403

    def test_list_transfers(self, admin_client, currency, company, bank):
        deposit_id = self._create_deposit(admin_client, currency, company)
        admin_client.post(
            f"{TRANSFER_URL}/",
            {
                "transfer_date": "2026-01-02",
                "deposit": deposit_id,
                "bank": str(bank.id),
                "amount_brl": "5890.00",
            },
        )
        response = admin_client.get(f"{TRANSFER_URL}/")
        assert response.status_code == 200
        assert len(response.data) >= 1


class TestTransferFileUpload:
    @staticmethod
    def _create_deposit(client, currency, company):
        response = client.post(
            f"{DEPOSIT_URL}/",
            {
                "deposit_date": "2026-01-02",
                "company": str(company.id),
                "invoice_number": "INV-001",
                "currency": str(currency.id),
                "amount_foreign": "1115.00",
                "amount_brl": "5894.49",
            },
        )
        return response.data["id"]

    def test_upload_transfer_file(self, admin_client, currency, company, bank):
        deposit_id = self._create_deposit(admin_client, currency, company)
        data = {
            "transfer_date": "2026-01-02",
            "deposit": deposit_id,
            "bank": str(bank.id),
            "amount_brl": "5890.00",
        }
        create = admin_client.post(f"{TRANSFER_URL}/", data)
        assert create.status_code == 201
        assert create.data["has_transfer_file"] is False
        transfer_id = create.data["id"]

        # Upload file via PUT
        pdf_content = b"%PDF-1.4 transfer test"
        transfer_file = io.BytesIO(pdf_content)
        transfer_file.name = "transfer.pdf"
        response = admin_client.put(
            f"{TRANSFER_URL}/{transfer_id}/", {**data, "transfer_file": transfer_file}, format="multipart"
        )
        assert response.status_code == 200
        assert response.data["has_transfer_file"] is True

    def test_download_transfer_file(self, admin_client, currency, company, bank):
        deposit_id = self._create_deposit(admin_client, currency, company)
        data = {
            "transfer_date": "2026-01-02",
            "deposit": deposit_id,
            "bank": str(bank.id),
            "amount_brl": "5890.00",
        }
        create = admin_client.post(f"{TRANSFER_URL}/", data)
        transfer_id = create.data["id"]

        pdf_content = b"%PDF-1.4 download test"
        transfer_file = io.BytesIO(pdf_content)
        transfer_file.name = "transfer.pdf"
        admin_client.put(f"{TRANSFER_URL}/{transfer_id}/", {**data, "transfer_file": transfer_file}, format="multipart")

        response = admin_client.get(f"{TRANSFER_URL}/{transfer_id}/file/")
        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
        assert pdf_content == response.content

    def test_download_nonexistent_file_returns_404(self, admin_client, currency, company, bank):
        deposit_id = self._create_deposit(admin_client, currency, company)
        data = {
            "transfer_date": "2026-01-02",
            "deposit": deposit_id,
            "bank": str(bank.id),
            "amount_brl": "5890.00",
        }
        create = admin_client.post(f"{TRANSFER_URL}/", data)
        transfer_id = create.data["id"]

        response = admin_client.get(f"{TRANSFER_URL}/{transfer_id}/file/")
        assert response.status_code == 404
