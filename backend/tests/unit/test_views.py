import io
import pytest
from core.models import Bank, Company, Currency, Deposit, Expense, ExpenseCategory, Transfer
from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient
from tests.conftest import TEST_USER_PASSWORD
from unittest.mock import patch

pytestmark = pytest.mark.django_db


@pytest.fixture
def admin_user():
    return User.objects.create_user(username="admin", password=TEST_USER_PASSWORD, is_staff=True)


@pytest.fixture
def viewer_user():
    return User.objects.create_user(username="viewer", password=TEST_USER_PASSWORD, is_staff=False)


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    token, _ = Token.objects.get_or_create(user=admin_user)
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


@pytest.fixture
def viewer_client(viewer_user):
    client = APIClient()
    token, _ = Token.objects.get_or_create(user=viewer_user)
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


@pytest.fixture
def expense_category():
    return ExpenseCategory.objects.create(code="TAXES", label="Taxes")


@pytest.fixture
def currency():
    return Currency.objects.create(code="USD", label="US Dollar", symbol="$")


@pytest.fixture
def company():
    return Company.objects.create(code="DEEL", label="Deel")


@pytest.fixture
def bank():
    return Bank.objects.create(code="SANTANDER", label="Santander")


@pytest.fixture
def deposit(admin_user, currency, company):
    return Deposit.objects.create(
        deposit_date=date(2026, 1, 2),
        company=company,
        invoice_number="INV-001",
        currency=currency,
        amount_foreign=Decimal("1115.00"),
        amount_brl=Decimal("5894.49"),
        created_by=admin_user,
    )


# --- Auth Views ---


class TestLoginView:
    def test_login_success(self, admin_user):
        client = APIClient()
        response = client.post("/api/v1/auth/login/", {"username": "admin", "password": TEST_USER_PASSWORD})
        assert response.status_code == 200
        assert response.data["user"]["username"] == "admin"
        assert "auth_token" in response.cookies

    def test_login_invalid_credentials(self):
        client = APIClient()
        response = client.post("/api/v1/auth/login/", {"username": "bad", "password": "wrong"})
        assert response.status_code == 401


class TestLogoutView:
    def test_logout(self, admin_client):
        response = admin_client.post("/api/v1/auth/logout/")
        assert response.status_code == 204


class TestMeView:
    def test_me(self, admin_client):
        response = admin_client.get("/api/v1/auth/me/")
        assert response.status_code == 200
        assert response.data["username"] == "admin"


# --- Dashboard View ---


class TestDashboardView:
    @patch("core.views.get_ptax_rate")
    def test_dashboard_with_ptax(self, mock_ptax, admin_client):
        mock_ptax.return_value = {"compra": "5.70", "venda": "5.71", "data_hora": "2026-04-04 13:09:20"}
        response = admin_client.get("/api/v1/dashboard/?year=2026")
        assert response.status_code == 200
        assert response.data["ptax_compra"] == "5.70"

    @patch("core.views.get_ptax_rate")
    def test_dashboard_without_ptax(self, mock_ptax, admin_client):
        mock_ptax.return_value = None
        response = admin_client.get("/api/v1/dashboard/?year=2026")
        assert response.status_code == 200
        assert response.data["ptax_compra"] is None


# --- Expense CRUD ---


class TestExpenseViewSet:
    def test_create(self, admin_client, expense_category):
        response = admin_client.post(
            "/api/v1/expenses/",
            {
                "expense_date": "2026-01-05",
                "category": str(expense_category.id),
                "amount": "100.00",
            },
        )
        assert response.status_code == 201

    def test_create_invalid(self, admin_client):
        response = admin_client.post("/api/v1/expenses/", {"expense_date": "2026-01-05"})
        assert response.status_code == 400

    def test_list(self, admin_client, expense_category):
        admin_client.post(
            "/api/v1/expenses/",
            {
                "expense_date": "2026-01-05",
                "category": str(expense_category.id),
                "amount": "100.00",
            },
        )
        response = admin_client.get("/api/v1/expenses/")
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_list_with_filters(self, admin_client, expense_category):
        admin_client.post(
            "/api/v1/expenses/",
            {
                "expense_date": "2026-03-15",
                "category": str(expense_category.id),
                "amount": "50.00",
            },
        )
        response = admin_client.get("/api/v1/expenses/?year=2026&month=3&category=TAXES")
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_retrieve(self, admin_client, expense_category):
        create = admin_client.post(
            "/api/v1/expenses/",
            {
                "expense_date": "2026-01-05",
                "category": str(expense_category.id),
                "amount": "100.00",
            },
        )
        response = admin_client.get(f"/api/v1/expenses/{create.data['id']}/")
        assert response.status_code == 200

    def test_update(self, admin_client, expense_category):
        create = admin_client.post(
            "/api/v1/expenses/",
            {
                "expense_date": "2026-01-05",
                "category": str(expense_category.id),
                "amount": "100.00",
            },
        )
        response = admin_client.put(
            f"/api/v1/expenses/{create.data['id']}/",
            {
                "expense_date": "2026-01-06",
                "category": str(expense_category.id),
                "amount": "200.00",
            },
        )
        assert response.status_code == 200
        assert response.data["amount"] == "200.00"

    def test_update_invalid(self, admin_client, expense_category):
        create = admin_client.post(
            "/api/v1/expenses/",
            {
                "expense_date": "2026-01-05",
                "category": str(expense_category.id),
                "amount": "100.00",
            },
        )
        response = admin_client.put(
            f"/api/v1/expenses/{create.data['id']}/",
            {
                "expense_date": "2026-01-06",
            },
        )
        assert response.status_code == 400

    def test_delete(self, admin_client, expense_category):
        create = admin_client.post(
            "/api/v1/expenses/",
            {
                "expense_date": "2026-01-05",
                "category": str(expense_category.id),
                "amount": "100.00",
            },
        )
        response = admin_client.delete(f"/api/v1/expenses/{create.data['id']}/")
        assert response.status_code == 204

    def test_viewer_cannot_create(self, viewer_client, expense_category):
        response = viewer_client.post(
            "/api/v1/expenses/",
            {
                "expense_date": "2026-01-05",
                "category": str(expense_category.id),
                "amount": "100.00",
            },
        )
        assert response.status_code == 403


# --- Expense File Upload/Download ---


class TestExpenseFileUpload:
    def test_create_with_receipt(self, admin_client, expense_category):
        receipt = io.BytesIO(b"%PDF-1.4 fake receipt")
        receipt.name = "receipt.pdf"
        response = admin_client.post(
            "/api/v1/expenses/",
            {
                "expense_date": "2026-01-05",
                "category": str(expense_category.id),
                "amount": "100.00",
                "receipt_file": receipt,
            },
            format="multipart",
        )
        assert response.status_code == 201
        assert response.data["has_receipt_file"] is True

    def test_update_with_receipt(self, admin_client, expense_category):
        data = {"expense_date": "2026-01-05", "category": str(expense_category.id), "amount": "100.00"}
        create = admin_client.post("/api/v1/expenses/", data)
        receipt = io.BytesIO(b"%PDF-1.4 updated")
        receipt.name = "receipt.pdf"
        response = admin_client.put(
            f"/api/v1/expenses/{create.data['id']}/",
            {**data, "receipt_file": receipt},
            format="multipart",
        )
        assert response.status_code == 200
        assert response.data["has_receipt_file"] is True


class TestExpenseFileView:
    def test_download(self, admin_client, admin_user, expense_category):
        expense = Expense.objects.create(
            expense_date="2026-01-05",
            category=expense_category,
            amount=100,
            receipt_file=b"%PDF-1.4 test",
            created_by=admin_user,
        )
        response = admin_client.get(f"/api/v1/expenses/{expense.id}/file/receipt/")
        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"

    def test_download_404(self, admin_client, admin_user, expense_category):
        expense = Expense.objects.create(
            expense_date="2026-01-05",
            category=expense_category,
            amount=100,
            created_by=admin_user,
        )
        response = admin_client.get(f"/api/v1/expenses/{expense.id}/file/receipt/")
        assert response.status_code == 404


# --- Deposit CRUD ---


class TestDepositViewSet:
    def _data(self, currency, company):
        return {
            "deposit_date": "2026-01-02",
            "company": str(company.id),
            "invoice_number": "INV-001",
            "currency": str(currency.id),
            "amount_foreign": "1115.00",
            "amount_brl": "5894.49",
        }

    def test_create(self, admin_client, currency, company):
        response = admin_client.post("/api/v1/deposits/", self._data(currency, company))
        assert response.status_code == 201

    def test_list_with_filters(self, admin_client, currency, company):
        admin_client.post("/api/v1/deposits/", self._data(currency, company))
        response = admin_client.get("/api/v1/deposits/?year=2026&month=1")
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_update(self, admin_client, currency, company):
        create = admin_client.post("/api/v1/deposits/", self._data(currency, company))
        data = {**self._data(currency, company), "amount_brl": "6000.00"}
        response = admin_client.put(f"/api/v1/deposits/{create.data['id']}/", data)
        assert response.status_code == 200

    def test_delete(self, admin_client, currency, company):
        create = admin_client.post("/api/v1/deposits/", self._data(currency, company))
        response = admin_client.delete(f"/api/v1/deposits/{create.data['id']}/")
        assert response.status_code == 204

    def test_create_with_nfe_file(self, admin_client, currency, company):
        nfe = io.BytesIO(b"%PDF nfe")
        nfe.name = "my_nfe.pdf"
        data = {**self._data(currency, company), "nfe_file": nfe}
        response = admin_client.post("/api/v1/deposits/", data, format="multipart")
        assert response.status_code == 201
        assert response.data["has_nfe_file"] is True

    def test_update_with_invoice_file(self, admin_client, currency, company):
        create = admin_client.post("/api/v1/deposits/", self._data(currency, company))
        invoice = io.BytesIO(b"%PDF invoice")
        invoice.name = "my_invoice.pdf"
        data = {**self._data(currency, company), "invoice_file": invoice}
        response = admin_client.put(f"/api/v1/deposits/{create.data['id']}/", data, format="multipart")
        assert response.status_code == 200
        assert response.data["has_invoice_file"] is True


# --- Deposit File Views ---


class TestDepositFileView:
    def test_download_nfe(self, admin_client, admin_user, currency, company):
        dep = Deposit.objects.create(
            deposit_date=date(2026, 1, 2),
            company=company,
            currency=currency,
            amount_foreign=Decimal("1115"),
            amount_brl=Decimal("5894"),
            nfe_file=b"%PDF nfe",
            created_by=admin_user,
        )
        response = admin_client.get(f"/api/v1/deposits/{dep.id}/file/nfe/")
        assert response.status_code == 200

    def test_download_invoice(self, admin_client, admin_user, currency, company):
        dep = Deposit.objects.create(
            deposit_date=date(2026, 1, 2),
            company=company,
            currency=currency,
            amount_foreign=Decimal("1115"),
            amount_brl=Decimal("5894"),
            invoice_file=b"%PDF inv",
            created_by=admin_user,
        )
        response = admin_client.get(f"/api/v1/deposits/{dep.id}/file/invoice/")
        assert response.status_code == 200

    def test_download_invalid_type(self, admin_client, deposit):
        response = admin_client.get(f"/api/v1/deposits/{deposit.id}/file/invalid/")
        assert response.status_code == 404

    def test_download_missing_file(self, admin_client, deposit):
        response = admin_client.get(f"/api/v1/deposits/{deposit.id}/file/nfe/")
        assert response.status_code == 404


# --- Transfer CRUD ---


class TestTransferViewSet:
    def test_create(self, admin_client, deposit, bank):
        response = admin_client.post(
            "/api/v1/transfers/",
            {
                "transfer_date": "2026-01-02",
                "deposit": str(deposit.id),
                "bank": str(bank.id),
                "amount_brl": "5890.00",
            },
        )
        assert response.status_code == 201

    def test_list_with_filters(self, admin_client, deposit, bank):
        admin_client.post(
            "/api/v1/transfers/",
            {
                "transfer_date": "2026-01-02",
                "deposit": str(deposit.id),
                "bank": str(bank.id),
                "amount_brl": "5890.00",
            },
        )
        response = admin_client.get("/api/v1/transfers/?year=2026&month=1&bank=SANTANDER")
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_update(self, admin_client, deposit, bank):
        create = admin_client.post(
            "/api/v1/transfers/",
            {
                "transfer_date": "2026-01-02",
                "deposit": str(deposit.id),
                "bank": str(bank.id),
                "amount_brl": "5890.00",
            },
        )
        response = admin_client.put(
            f"/api/v1/transfers/{create.data['id']}/",
            {
                "transfer_date": "2026-01-03",
                "deposit": str(deposit.id),
                "bank": str(bank.id),
                "amount_brl": "5900.00",
            },
        )
        assert response.status_code == 200

    def test_delete(self, admin_client, deposit, bank):
        create = admin_client.post(
            "/api/v1/transfers/",
            {
                "transfer_date": "2026-01-02",
                "deposit": str(deposit.id),
                "bank": str(bank.id),
                "amount_brl": "5890.00",
            },
        )
        response = admin_client.delete(f"/api/v1/transfers/{create.data['id']}/")
        assert response.status_code == 204

    def test_create_with_file(self, admin_client, deposit, bank):
        f = io.BytesIO(b"%PDF transfer")
        f.name = "my_transfer.pdf"
        response = admin_client.post(
            "/api/v1/transfers/",
            {
                "transfer_date": "2026-01-02",
                "deposit": str(deposit.id),
                "bank": str(bank.id),
                "amount_brl": "5890.00",
                "transfer_file": f,
            },
            format="multipart",
        )
        assert response.status_code == 201
        assert response.data["has_transfer_file"] is True


# --- Transfer File View ---


class TestTransferFileView:
    def test_download(self, admin_client, admin_user, deposit, bank):
        transfer = Transfer.objects.create(
            transfer_date=date(2026, 1, 2),
            deposit=deposit,
            bank=bank,
            amount_brl=Decimal("5890"),
            transfer_file=b"%PDF transfer",
            created_by=admin_user,
        )
        response = admin_client.get(f"/api/v1/transfers/{transfer.id}/file/")
        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"

    def test_download_404(self, admin_client, admin_user, deposit, bank):
        transfer = Transfer.objects.create(
            transfer_date=date(2026, 1, 2),
            deposit=deposit,
            bank=bank,
            amount_brl=Decimal("5890"),
            created_by=admin_user,
        )
        response = admin_client.get(f"/api/v1/transfers/{transfer.id}/file/")
        assert response.status_code == 404


# --- NFE Samples ---


class TestNfeSampleViewSet:
    def test_create(self, admin_client):
        response = admin_client.post(
            "/api/v1/nfe-samples/",
            {
                "description": "Test NFE",
                "body": "<xml>test</xml>",
            },
        )
        assert response.status_code == 201

    def test_list_with_filters(self, admin_client):
        admin_client.post("/api/v1/nfe-samples/", {"description": "Test", "body": "<xml/>"})
        response = admin_client.get("/api/v1/nfe-samples/?year=2026")
        assert response.status_code == 200
