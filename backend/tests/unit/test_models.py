import pytest
from core.models import Deposit, Expense, Transfer
from datetime import date
from decimal import Decimal

pytestmark = pytest.mark.django_db


class TestExpense:
    def test_create_expense(self, admin_user, expense_category):
        expense = Expense.objects.create(
            expense_date=date(2026, 1, 5),
            category=expense_category,
            description="Tax payment",
            amount=Decimal("4380.59"),
            created_by=admin_user,
        )
        assert expense.id is not None
        assert expense.category == expense_category
        assert expense.amount == Decimal("4380.59")
        assert expense.created_at is not None
        assert expense.updated_at is not None

    def test_expense_str(self, admin_user, expense_category):
        expense = Expense.objects.create(
            expense_date=date(2026, 1, 10),
            category=expense_category,
            amount=Decimal("889.64"),
            created_by=admin_user,
        )
        assert "Taxes" in str(expense)

    def test_expense_with_sub_category(self, admin_user, expense_category, expense_sub_category):
        expense = Expense.objects.create(
            expense_date=date(2026, 1, 5),
            category=expense_category,
            sub_category=expense_sub_category,
            amount=Decimal("500.00"),
            created_by=admin_user,
        )
        assert expense.sub_category == expense_sub_category
        assert expense.sub_category.parent == expense_category


class TestExpenseSubCategory:
    def test_str_and_parent(self, expense_category, expense_sub_category):
        assert expense_sub_category.parent == expense_category
        assert "Taxes" in str(expense_sub_category)
        assert "TFE" in str(expense_sub_category)


class TestDeposit:
    def test_create_deposit(self, admin_user, currency, company):
        deposit = Deposit.objects.create(
            deposit_date=date(2026, 1, 2),
            company=company,
            invoice_number="INV-ne3wdd4-2026-1",
            period_start=date(2025, 12, 21),
            period_end=date(2025, 12, 27),
            currency=currency,
            amount_foreign=Decimal("1115.00"),
            amount_brl=Decimal("5894.49"),
            created_by=admin_user,
        )
        assert deposit.id is not None
        assert deposit.amount_foreign == Decimal("1115.00")
        assert deposit.created_at is not None


class TestTransfer:
    def test_create_transfer(self, admin_user, bank):
        transfer = Transfer.objects.create(
            transfer_date=date(2026, 1, 2),
            bank=bank,
            amount_brl=Decimal("5890.00"),
            created_by=admin_user,
        )
        assert transfer.bank == bank

    def test_transfer_str(self, admin_user, bank):
        transfer = Transfer.objects.create(
            transfer_date=date(2026, 1, 2),
            bank=bank,
            amount_brl=Decimal("5890.00"),
            created_by=admin_user,
        )
        assert "TestBank" in str(transfer)
        assert "5890.00" in str(transfer)


class TestLookupModels:
    def test_currency_str(self, currency):
        assert "USD" in str(currency)
        assert "US Dollar" in str(currency)

    def test_company_str(self, company):
        assert "TestCompany" in str(company)

    def test_bank_str(self, bank):
        assert "TestBank" in str(bank)


class TestNfeSample:
    def test_nfe_sample_str(self, admin_user):
        from core.models import NfeSample

        nfe = NfeSample.objects.create(description="Test NFE", body="Body text", created_by=admin_user)
        assert "Test NFE" in str(nfe)

    def test_nfe_sample_str_no_description(self, admin_user):
        from core.models import NfeSample

        nfe = NfeSample.objects.create(description="", body="Body text", created_by=admin_user)
        assert "NFE Sample" in str(nfe)
