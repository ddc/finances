import pytest
from core.models import Expense, ExpenseCategory, Transfer
from core.serializers import DepositSerializer, ExpenseSerializer, TransferSerializer
from datetime import date
from decimal import Decimal

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

    def test_has_receipt_file_flag(self, viewer_user):
        cat = ExpenseCategory.objects.create(code="TAXES", label="Taxes")
        expense = Expense.objects.create(
            expense_date=date(2026, 1, 5),
            category=cat,
            amount=Decimal("100.00"),
            created_by=viewer_user,
        )
        data = ExpenseSerializer(expense).data
        assert data["has_receipt_file"] is False


class TestDepositSerializer:
    def test_valid_deposit(self, currency, company):
        data = {
            "deposit_date": "2026-01-02",
            "company": str(company.id),
            "invoice_number": "INV-001",
            "currency": str(currency.id),
            "amount_foreign": "1115.00",
            "amount_brl": "5894.49",
        }
        serializer = DepositSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_has_file_flags(self, deposit):
        data = DepositSerializer(deposit).data
        assert data["has_nfe_file"] is False
        assert data["has_invoice_file"] is False


class TestTransferSerializer:
    def test_valid_transfer(self, deposit, bank):
        data = {
            "transfer_date": "2026-01-02",
            "deposit": str(deposit.id),
            "bank": str(bank.id),
            "amount_brl": "5890.00",
        }
        serializer = TransferSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_has_transfer_file_flag(self, deposit, bank, viewer_user):
        transfer = Transfer.objects.create(
            transfer_date=date(2026, 1, 2),
            deposit=deposit,
            bank=bank,
            amount_brl=Decimal("5890.00"),
            created_by=viewer_user,
        )
        data = TransferSerializer(transfer).data
        assert data["has_transfer_file"] is False
