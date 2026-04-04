import pytest
from core.models import Bank, Company, Currency, Deposit, ExpenseCategory
from core.serializers import DepositSerializer, ExpenseSerializer, TransferSerializer
from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from tests.conftest import TEST_USER_PASSWORD

pytestmark = pytest.mark.django_db


class TestExpenseSerializer:
    def test_valid_expense(self):
        cat = ExpenseCategory.objects.create(code="TAXES", label="Taxes")
        data = {"expense_date": "2026-01-05", "category": str(cat.id), "amount": "4380.59", "description": "Tax"}
        serializer = ExpenseSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_invalid_category(self):
        data = {"expense_date": "2026-01-05", "category": "00000000-0000-0000-0000-000000000000", "amount": "100.00"}
        serializer = ExpenseSerializer(data=data)
        assert not serializer.is_valid()
        assert "category" in serializer.errors


class TestDepositSerializer:
    def test_valid_deposit(self):
        curr = Currency.objects.create(code="USD", label="US Dollar", symbol="$")
        comp = Company.objects.create(code="DEEL", label="Deel")
        data = {
            "deposit_date": "2026-01-02",
            "company": str(comp.id),
            "invoice_number": "INV-001",
            "currency": str(curr.id),
            "amount_foreign": "1115.00",
            "amount_brl": "5894.49",
        }
        serializer = DepositSerializer(data=data)
        assert serializer.is_valid(), serializer.errors


class TestTransferSerializer:
    def test_valid_transfer(self):
        user = User.objects.create_user(username="testuser2", password=TEST_USER_PASSWORD)
        curr = Currency.objects.create(code="USD", label="US Dollar", symbol="$")
        comp = Company.objects.create(code="DEEL", label="Deel")
        bank = Bank.objects.create(code="SANTANDER", label="Santander")
        deposit = Deposit.objects.create(
            deposit_date=date(2026, 1, 2),
            company=comp,
            invoice_number="INV-001",
            currency=curr,
            amount_foreign=Decimal("1115.00"),
            amount_brl=Decimal("5894.49"),
            created_by=user,
        )
        data = {
            "transfer_date": "2026-01-02",
            "deposit": str(deposit.id),
            "bank": str(bank.id),
            "amount_brl": "5890.00",
        }
        serializer = TransferSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
