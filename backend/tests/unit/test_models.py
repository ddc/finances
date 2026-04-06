import pytest
from core.models import Bank, Company, Currency, Deposit, Expense, ExpenseCategory, Transfer
from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from tests.conftest import TEST_USER_PASSWORD

pytestmark = pytest.mark.django_db


@pytest.fixture
def user():
    return User.objects.create_user(username="testuser", password=TEST_USER_PASSWORD)


@pytest.fixture
def category():
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


class TestExpense:
    def test_create_expense(self, user, category):
        expense = Expense.objects.create(
            expense_date=date(2026, 1, 5),
            category=category,
            description="Tax payment",
            amount=Decimal("4380.59"),
            created_by=user,
        )
        assert expense.id is not None
        assert expense.category == category
        assert expense.amount == Decimal("4380.59")
        assert expense.created_at is not None
        assert expense.updated_at is not None

    def test_expense_str(self, user, category):
        expense = Expense.objects.create(
            expense_date=date(2026, 1, 10),
            category=category,
            amount=Decimal("889.64"),
            created_by=user,
        )
        assert "Taxes" in str(expense)


class TestDeposit:
    def test_create_deposit(self, user, currency, company):
        deposit = Deposit.objects.create(
            deposit_date=date(2026, 1, 2),
            company=company,
            invoice_number="INV-ne3wdd4-2026-1",
            invoice_issue_date=date(2025, 12, 26),
            period_start=date(2025, 12, 21),
            period_end=date(2025, 12, 27),
            currency=currency,
            amount_foreign=Decimal("1115.00"),
            amount_brl=Decimal("5894.49"),
            created_by=user,
        )
        assert deposit.id is not None
        assert deposit.amount_foreign == Decimal("1115.00")
        assert deposit.created_at is not None


class TestTransfer:
    def test_create_transfer_linked_to_deposit(self, user, currency, company, bank):
        deposit = Deposit.objects.create(
            deposit_date=date(2026, 1, 2),
            company=company,
            invoice_number="INV-53",
            currency=currency,
            amount_foreign=Decimal("1115.00"),
            amount_brl=Decimal("5890.00"),
            created_by=user,
        )
        transfer = Transfer.objects.create(
            transfer_date=date(2026, 1, 2),
            deposit=deposit,
            bank=bank,
            amount_brl=Decimal("5890.00"),
            created_by=user,
        )
        assert transfer.deposit == deposit
        assert transfer.bank == bank

    def test_transfer_str(self, user, currency, company, bank):
        deposit = Deposit.objects.create(
            deposit_date=date(2026, 1, 2),
            company=company,
            invoice_number="INV-53",
            currency=currency,
            amount_foreign=Decimal("1115.00"),
            amount_brl=Decimal("5890.00"),
            created_by=user,
        )
        transfer = Transfer.objects.create(
            transfer_date=date(2026, 1, 2),
            deposit=deposit,
            bank=bank,
            amount_brl=Decimal("5890.00"),
            created_by=user,
        )
        assert "Santander" in str(transfer)
        assert "5890.00" in str(transfer)


class TestLookupModels:
    def test_currency_str(self, currency):
        assert "USD" in str(currency)
        assert "US Dollar" in str(currency)

    def test_company_str(self, company):
        assert "Deel" in str(company)

    def test_bank_str(self, bank):
        assert "Santander" in str(bank)


class TestNfeSample:
    def test_nfe_sample_str(self, user):
        from core.models import NfeSample

        nfe = NfeSample.objects.create(description="Test NFE", body="Body text", created_by=user)
        assert "Test NFE" in str(nfe)

    def test_nfe_sample_str_no_description(self, user):
        from core.models import NfeSample

        nfe = NfeSample.objects.create(description="", body="Body text", created_by=user)
        assert "NFE Sample" in str(nfe)
