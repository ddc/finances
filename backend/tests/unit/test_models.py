import pytest
from core.models import Deposit, Expense, Transfer
from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User

pytestmark = pytest.mark.django_db


class TestExpense:
    def test_create_expense(self):
        user = User.objects.create_user(username="testuser", password="testpass123")
        expense = Expense.objects.create(
            expense_date=date(2026, 1, 5),
            category="IMPOSTOS",
            description="Tax payment",
            amount=Decimal("4380.59"),
            created_by=user,
        )
        assert expense.id is not None
        assert expense.category == "IMPOSTOS"
        assert expense.amount == Decimal("4380.59")
        assert expense.created_at is not None
        assert expense.updated_at is not None

    def test_expense_category_choices(self):
        choices = dict(Expense.CategoryChoices.choices)
        assert "IMPOSTOS" in choices
        assert "PLANO_SAUDE" in choices
        assert "CONTABILIDADE" in choices
        assert "OTHER" in choices

    def test_expense_str(self):
        user = User.objects.create_user(username="testuser2", password="testpass123")
        expense = Expense.objects.create(
            expense_date=date(2026, 1, 10),
            category="PLANO_SAUDE",
            amount=Decimal("889.64"),
            created_by=user,
        )
        assert "PLANO_SAUDE" in str(expense)


class TestDeposit:
    def test_create_deposit(self):
        user = User.objects.create_user(username="testuser3", password="testpass123")
        deposit = Deposit.objects.create(
            deposit_date=date(2026, 1, 2),
            invoice_number="INV-ne3wdd4-2026-1",
            invoice_issue_date=date(2025, 12, 26),
            period_start=date(2025, 12, 21),
            period_end=date(2025, 12, 27),
            amount_usd=Decimal("1115.00"),
            amount_brl=Decimal("5894.49"),
            created_by=user,
        )
        assert deposit.id is not None
        assert deposit.amount_usd == Decimal("1115.00")
        assert deposit.created_at is not None


class TestTransfer:
    def test_create_transfer_linked_to_deposit(self):
        user = User.objects.create_user(username="testuser4", password="testpass123")
        deposit = Deposit.objects.create(
            deposit_date=date(2026, 1, 2),
            invoice_number="INV-53",
            invoice_issue_date=date(2025, 12, 26),
            period_start=date(2025, 12, 21),
            period_end=date(2025, 12, 27),
            amount_usd=Decimal("1115.00"),
            amount_brl=Decimal("5890.00"),
            created_by=user,
        )
        transfer = Transfer.objects.create(
            transfer_date=date(2026, 1, 2),
            deposit=deposit,
            bank_name="SANTANDER",
            amount_brl=Decimal("5890.00"),
            created_by=user,
        )
        assert transfer.deposit == deposit
        assert transfer.bank_name == "SANTANDER"

    def test_transfer_bank_choices(self):
        choices = dict(Transfer.BankChoices.choices)
        assert "SANTANDER" in choices
