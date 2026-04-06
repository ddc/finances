import io
import pytest
from core.models import Expense, ExpenseCategory
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient
from tests.conftest import TEST_USER_PASSWORD

pytestmark = pytest.mark.django_db

BASE_URL = "/api/v1/expenses"


@pytest.fixture
def admin_user():
    return User.objects.create_user(username="admin", password=TEST_USER_PASSWORD, is_staff=True)


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    token, _ = Token.objects.get_or_create(user=admin_user)
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


@pytest.fixture
def expense_category():
    return ExpenseCategory.objects.create(code="TAXES", label="Taxes")


class TestExpenseFileUpload:
    def test_create_expense_with_receipt_file(self, admin_client, expense_category):
        pdf_content = b"%PDF-1.4 fake receipt"
        receipt = io.BytesIO(pdf_content)
        receipt.name = "receipt.pdf"
        response = admin_client.post(
            f"{BASE_URL}/",
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

    def test_update_expense_with_receipt_file(self, admin_client, expense_category):
        data = {"expense_date": "2026-01-05", "category": str(expense_category.id), "amount": "100.00"}
        create = admin_client.post(f"{BASE_URL}/", data)
        expense_id = create.data["id"]
        assert create.data["has_receipt_file"] is False

        pdf_content = b"%PDF-1.4 updated receipt"
        receipt = io.BytesIO(pdf_content)
        receipt.name = "receipt.pdf"
        response = admin_client.put(
            f"{BASE_URL}/{expense_id}/",
            {**data, "receipt_file": receipt},
            format="multipart",
        )
        assert response.status_code == 200
        assert response.data["has_receipt_file"] is True


class TestExpenseFileView:
    def test_download_receipt_file(self, admin_client, admin_user, expense_category):
        cat = expense_category
        expense = Expense.objects.create(
            expense_date="2026-01-05",
            category=cat,
            amount=100,
            receipt_file=b"%PDF-1.4 test receipt",
            created_by=admin_user,
        )
        response = admin_client.get(f"{BASE_URL}/{expense.id}/file/")
        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
        assert response.content == b"%PDF-1.4 test receipt"

    def test_download_nonexistent_file_returns_404(self, admin_client, admin_user, expense_category):
        expense = Expense.objects.create(
            expense_date="2026-01-05",
            category=expense_category,
            amount=100,
            created_by=admin_user,
        )
        response = admin_client.get(f"{BASE_URL}/{expense.id}/file/")
        assert response.status_code == 404
