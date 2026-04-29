import io
import pytest

pytestmark = [pytest.mark.django_db, pytest.mark.integration]

BASE_URL = "/api/v1/deposits"
FILE_URL = "/api/v1/deposits"


def _valid_deposit(currency, company):
    return {
        "deposit_date": "2026-01-02",
        "company": str(company.id),
        "invoice_number": "INV-001",
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


class TestDepositFileUpload:
    def test_upload_nfe_file(self, admin_client, currency, company):
        # Create deposit first
        data = _valid_deposit(currency, company)
        create = admin_client.post(f"{BASE_URL}/", data)
        assert create.status_code == 201
        deposit_id = create.data["id"]
        assert create.data["has_nfe_file"] is False

        # Upload NFE file via PUT
        pdf_content = b"%PDF-1.4 fake pdf content for testing"
        nfe_file = io.BytesIO(pdf_content)
        nfe_file.name = "test_nfe.pdf"
        update_data = {**data, "nfe_file": nfe_file}
        response = admin_client.put(f"{BASE_URL}/{deposit_id}/", update_data, format="multipart")
        assert response.status_code == 200
        assert response.data["has_nfe_file"] is True

    def test_upload_invoice_file(self, admin_client, currency, company):
        data = _valid_deposit(currency, company)
        create = admin_client.post(f"{BASE_URL}/", data)
        deposit_id = create.data["id"]

        pdf_content = b"%PDF-1.4 fake invoice content"
        invoice_file = io.BytesIO(pdf_content)
        invoice_file.name = "test_invoice.pdf"
        update_data = {**data, "invoice_file": invoice_file}
        response = admin_client.put(f"{BASE_URL}/{deposit_id}/", update_data, format="multipart")
        assert response.status_code == 200
        assert response.data["has_invoice_file"] is True

    def test_download_nfe_file(self, admin_client, currency, company):
        data = _valid_deposit(currency, company)
        create = admin_client.post(f"{BASE_URL}/", data)
        deposit_id = create.data["id"]

        # Upload
        pdf_content = b"%PDF-1.4 nfe download test"
        nfe_file = io.BytesIO(pdf_content)
        nfe_file.name = "nfe.pdf"
        admin_client.put(f"{BASE_URL}/{deposit_id}/", {**data, "nfe_file": nfe_file}, format="multipart")

        # Download
        response = admin_client.get(f"{FILE_URL}/{deposit_id}/file/nfe/")
        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
        assert pdf_content == response.content

    def test_download_nonexistent_file_returns_404(self, admin_client, currency, company):
        data = _valid_deposit(currency, company)
        create = admin_client.post(f"{BASE_URL}/", data)
        deposit_id = create.data["id"]

        response = admin_client.get(f"{FILE_URL}/{deposit_id}/file/nfe/")
        assert response.status_code == 404

    def test_download_invalid_file_type_returns_404(self, admin_client, currency, company):
        data = _valid_deposit(currency, company)
        create = admin_client.post(f"{BASE_URL}/", data)
        deposit_id = create.data["id"]

        response = admin_client.get(f"{FILE_URL}/{deposit_id}/file/invalid/")
        assert response.status_code == 404
