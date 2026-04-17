import pytest
from core.services.dashboard import get_dashboard_data
from core.services.ptax import get_ptax_rate
from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from tests.conftest import TEST_USER_PASSWORD
from unittest.mock import MagicMock, patch

pytestmark = pytest.mark.django_db


class TestPtaxService:
    @staticmethod
    def setup_method():
        from core.services import ptax

        ptax._cache.clear()

    @patch("core.services.ptax.requests.get")
    def test_get_ptax_rate_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"value": [{"cotacaoCompra": 5.2353, "cotacaoVenda": 5.2359}]}
        mock_get.return_value = mock_response
        result = get_ptax_rate()
        assert result["compra"] == Decimal("5.2353")
        assert result["venda"] == Decimal("5.2359")

    @patch("core.services.ptax.requests.get")
    def test_get_ptax_rate_api_error(self, mock_get):
        mock_get.side_effect = Exception("Connection error")
        result = get_ptax_rate()
        assert result is None

    @patch("core.services.ptax.requests.get")
    def test_get_ptax_rate_empty_response(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"value": []}
        mock_get.return_value = mock_response
        result = get_ptax_rate()
        assert result is None


class TestDashboardService:
    def test_dashboard_data_empty(self):
        data = get_dashboard_data(2026)
        assert data["year"] == 2026
        assert data["summary"]["total_income_brl"] == Decimal("0")
        assert data["summary"]["total_expenses_brl"] == Decimal("0")
        assert data["monthly"] == []
        assert data["recent_activity"] == []

    def test_dashboard_data_with_records(self):
        from core.models import Company, Currency, Deposit, Expense, ExpenseCategory

        user = User.objects.create_user(username="testuser", password=TEST_USER_PASSWORD)
        cat = ExpenseCategory.objects.create(code="TAXES", label="Taxes")
        curr = Currency.objects.create(code="USD", label="US Dollar", symbol="$")
        comp = Company.objects.create(code="TESTCOMPANY", label="TestCompany")
        Expense.objects.create(expense_date=date(2026, 1, 5), category=cat, amount=Decimal("4380.59"), created_by=user)
        Deposit.objects.create(
            deposit_date=date(2026, 1, 2),
            company=comp,
            invoice_number="INV-001",
            currency=curr,
            amount_foreign=Decimal("1115.00"),
            amount_brl=Decimal("5894.49"),
            created_by=user,
        )
        data = get_dashboard_data(2026)
        assert data["summary"]["total_income_brl"] == Decimal("5894.49")
        assert data["summary"]["total_expenses_brl"] == Decimal("4380.59")
        assert len(data["recent_activity"]) == 2
