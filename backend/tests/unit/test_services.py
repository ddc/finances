import pytest
from core.services.dashboard import get_dashboard_data
from core.services.ptax import get_ptax_rate
from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from unittest.mock import MagicMock, patch

pytestmark = pytest.mark.django_db


class TestPtaxService:
    def setup_method(self):
        from core.services import ptax

        ptax._cache["compra"] = None
        ptax._cache["venda"] = None
        ptax._cache["fetched_at"] = 0.0

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
        from core.models import Deposit, Expense

        user = User.objects.create_user(username="testuser", password="testpass123")
        Expense.objects.create(
            expense_date=date(2026, 1, 5), category="IMPOSTOS", amount=Decimal("4380.59"), created_by=user
        )
        Deposit.objects.create(
            deposit_date=date(2026, 1, 2),
            invoice_number="INV-001",
            invoice_issue_date=date(2025, 12, 26),
            period_start=date(2025, 12, 21),
            period_end=date(2025, 12, 27),
            amount_usd=Decimal("1115.00"),
            amount_brl=Decimal("5894.49"),
            created_by=user,
        )
        data = get_dashboard_data(2026)
        assert data["summary"]["total_income_brl"] == Decimal("5894.49")
        assert data["summary"]["total_expenses_brl"] == Decimal("4380.59")
        assert len(data["recent_activity"]) == 2
