import pytest
from core.serializers import DepositSerializer, ExpenseSerializer, TransferSerializer
from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User

pytestmark = pytest.mark.django_db


class TestExpenseSerializer:
    def test_valid_expense(self):
        data = {"expense_date": "2026-01-05", "category": "IMPOSTOS", "amount": "4380.59", "description": "Tax"}
        serializer = ExpenseSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_invalid_category(self):
        data = {"expense_date": "2026-01-05", "category": "INVALID", "amount": "100.00"}
        serializer = ExpenseSerializer(data=data)
        assert not serializer.is_valid()
        assert "category" in serializer.errors


class TestDepositSerializer:
    def test_valid_deposit(self):
        data = {
            "deposit_date": "2026-01-02",
            "invoice_number": "INV-001",
            "invoice_issue_date": "2025-12-26",
            "period_start": "2025-12-21",
            "period_end": "2025-12-27",
            "amount_foreign": "1115.00",
            "amount_brl": "5894.49",
        }
        serializer = DepositSerializer(data=data)
        assert serializer.is_valid(), serializer.errors


class TestTransferSerializer:
    def test_valid_transfer(self):
        user = User.objects.create_user(username="testuser2", password="testpass123")
        from core.models import Deposit

        deposit = Deposit.objects.create(
            deposit_date=date(2026, 1, 2),
            invoice_number="INV-001",
            invoice_issue_date=date(2025, 12, 26),
            period_start=date(2025, 12, 21),
            period_end=date(2025, 12, 27),
            amount_foreign=Decimal("1115.00"),
            amount_brl=Decimal("5894.49"),
            created_by=user,
        )
        data = {
            "transfer_date": "2026-01-02",
            "deposit": deposit.id,
            "bank_name": "SANTANDER",
            "amount_brl": "5890.00",
        }
        serializer = TransferSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
