import os
import pytest
from core.models import Bank, Company, Currency, Deposit, ExpenseCategory
from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

TEST_USER_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "test-pass-123!")  # NOSONAR


def _authed_client(user):
    client = APIClient()
    token, _ = Token.objects.get_or_create(user=user)
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


@pytest.fixture
def admin_user():
    return User.objects.create_user(username="admin", password=TEST_USER_PASSWORD, is_staff=True)


@pytest.fixture
def viewer_user():
    return User.objects.create_user(username="viewer", password=TEST_USER_PASSWORD, is_staff=False)


@pytest.fixture
def admin_client(admin_user):
    return _authed_client(admin_user)


@pytest.fixture
def viewer_client(viewer_user):
    return _authed_client(viewer_user)


@pytest.fixture
def expense_category():
    return ExpenseCategory.objects.create(code="TAXES", label="Taxes")


@pytest.fixture
def currency():
    return Currency.objects.create(code="USD", label="US Dollar", symbol="$")


@pytest.fixture
def company():
    return Company.objects.create(code="TESTCOMPANY", label="TestCompany")


@pytest.fixture
def bank():
    return Bank.objects.create(code="TESTBANK", label="TestBank")


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
