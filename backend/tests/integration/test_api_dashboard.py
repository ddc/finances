import pytest
from unittest.mock import patch

pytestmark = [pytest.mark.django_db, pytest.mark.integration]


class TestDashboard:
    @patch("core.views.get_ptax_rate", return_value=None)
    def test_dashboard_empty(self, mock_ptax, admin_client):
        response = admin_client.get("/api/v1/dashboard/?year=2026")
        assert response.status_code == 200
        assert response.data["year"] == 2026
        assert response.data["ptax_compra"] is None
        assert response.data["ptax_venda"] is None
        assert "summary" in response.data
        assert "monthly" in response.data
        assert "recent_activity" in response.data

    @patch("core.views.get_ptax_rate", return_value={"compra": "5.2353", "venda": "5.2359"})
    def test_dashboard_with_ptax(self, mock_ptax, admin_client):
        response = admin_client.get("/api/v1/dashboard/?year=2026")
        assert response.status_code == 200
        assert response.data["ptax_compra"] == "5.2353"
        assert response.data["ptax_venda"] == "5.2359"

    @patch("core.views.get_ptax_rate", return_value=None)
    def test_dashboard_with_data(self, mock_ptax, admin_client, expense_category, currency, company):
        admin_client.post(
            "/api/v1/expenses/",
            {"expense_date": "2026-01-05", "category": str(expense_category.id), "amount": "100.00"},
        )
        admin_client.post(
            "/api/v1/deposits/",
            {
                "deposit_date": "2026-01-02",
                "company": str(company.id),
                "invoice_number": "INV-001",
                "invoice_issue_date": "2025-12-26",
                "period_start": "2025-12-21",
                "period_end": "2025-12-27",
                "currency": str(currency.id),
                "amount_foreign": "1115.00",
                "amount_brl": "5894.49",
            },
        )
        response = admin_client.get("/api/v1/dashboard/?year=2026")
        assert response.status_code == 200
        from decimal import Decimal

        assert Decimal(str(response.data["summary"]["total_income_brl"])) == Decimal("5894.49")
