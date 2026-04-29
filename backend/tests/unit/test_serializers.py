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

    def test_valid_expense_with_matching_sub_category(self, expense_category, expense_sub_category):
        data = {
            "expense_date": "2026-01-05",
            "category": str(expense_category.id),
            "sub_category": str(expense_sub_category.id),
            "amount": "100.00",
        }
        serializer = ExpenseSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_sub_category_parent_mismatch_rejected(self, expense_category, expense_sub_category):
        other_parent = ExpenseCategory.objects.create(code="OTHER", label="Other")
        data = {
            "expense_date": "2026-01-05",
            "category": str(other_parent.id),
            "sub_category": str(expense_sub_category.id),
            "amount": "100.00",
        }
        serializer = ExpenseSerializer(data=data)
        assert not serializer.is_valid()
        assert "sub_category" in serializer.errors

    def test_sub_category_code_and_label_read_only(self, admin_user, expense_category, expense_sub_category):
        expense = Expense.objects.create(
            expense_date=date(2026, 1, 5),
            category=expense_category,
            sub_category=expense_sub_category,
            amount=Decimal("100.00"),
            created_by=admin_user,
        )
        data = ExpenseSerializer(expense).data
        assert data["sub_category_code"] == "TFE"
        assert data["sub_category_label"] == "TFE"


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

    def test_period_end_before_start_rejected(self, currency, company):
        data = {
            "deposit_date": "2026-01-02",
            "company": str(company.id),
            "currency": str(currency.id),
            "amount_foreign": "1115.00",
            "amount_brl": "5894.49",
            "period_start": "2026-01-10",
            "period_end": "2026-01-05",
        }
        serializer = DepositSerializer(data=data)
        assert not serializer.is_valid()
        assert "period_end" in serializer.errors

    def test_period_end_equal_start_accepted(self, currency, company):
        data = {
            "deposit_date": "2026-01-02",
            "company": str(company.id),
            "currency": str(currency.id),
            "amount_foreign": "1115.00",
            "amount_brl": "5894.49",
            "period_start": "2026-01-10",
            "period_end": "2026-01-10",
        }
        serializer = DepositSerializer(data=data)
        assert serializer.is_valid(), serializer.errors


class TestTransferSerializer:
    def test_valid_transfer(self, bank):
        data = {
            "transfer_date": "2026-01-02",
            "bank": str(bank.id),
            "amount_brl": "5890.00",
        }
        serializer = TransferSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_has_transfer_file_flag(self, bank, viewer_user):
        transfer = Transfer.objects.create(
            transfer_date=date(2026, 1, 2),
            bank=bank,
            amount_brl=Decimal("5890.00"),
            created_by=viewer_user,
        )
        data = TransferSerializer(transfer).data
        assert data["has_transfer_file"] is False
