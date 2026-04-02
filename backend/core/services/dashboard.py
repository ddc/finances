from core.models import Deposit, Expense, Transfer
from decimal import Decimal
from django.conf import settings
from django.db.models import Sum
from django.db.models.functions import ExtractMonth


def get_dashboard_data(year, month=None):
    settings.LOG.info(f"Building dashboard data: year={year}, month={month}")
    deposit_qs = Deposit.objects.filter(deposit_date__year=year)
    expense_qs = Expense.objects.filter(expense_date__year=year)
    transfer_qs = Transfer.objects.filter(transfer_date__year=year)

    if month:
        deposit_qs = deposit_qs.filter(deposit_date__month=month)
        expense_qs = expense_qs.filter(expense_date__month=month)
        transfer_qs = transfer_qs.filter(transfer_date__month=month)

    total_income_brl = deposit_qs.aggregate(total=Sum("amount_brl"))["total"] or Decimal("0")
    total_income_usd = deposit_qs.aggregate(total=Sum("amount_usd"))["total"] or Decimal("0")
    total_expenses = expense_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0")
    total_transferred = transfer_qs.aggregate(total=Sum("amount_brl"))["total"] or Decimal("0")

    monthly_income = (
        deposit_qs.annotate(month=ExtractMonth("deposit_date"))
        .values("month")
        .annotate(income_brl=Sum("amount_brl"), income_usd=Sum("amount_usd"))
        .order_by("month")
    )
    monthly_expenses = (
        expense_qs.annotate(month=ExtractMonth("expense_date"))
        .values("month")
        .annotate(expenses_brl=Sum("amount"))
        .order_by("month")
    )
    monthly_transferred = (
        transfer_qs.annotate(month=ExtractMonth("transfer_date"))
        .values("month")
        .annotate(transferred_brl=Sum("amount_brl"))
        .order_by("month")
    )

    months = {}
    for row in monthly_income:
        months.setdefault(row["month"], {})["income_brl"] = row["income_brl"]
        months.setdefault(row["month"], {})["income_usd"] = row["income_usd"]
    for row in monthly_expenses:
        months.setdefault(row["month"], {})["expenses_brl"] = row["expenses_brl"]
    for row in monthly_transferred:
        months.setdefault(row["month"], {})["transferred_brl"] = row["transferred_brl"]

    monthly = [
        {
            "month": m,
            "income_brl": data.get("income_brl", Decimal("0")),
            "income_usd": data.get("income_usd", Decimal("0")),
            "expenses_brl": data.get("expenses_brl", Decimal("0")),
            "transferred_brl": data.get("transferred_brl", Decimal("0")),
        }
        for m, data in sorted(months.items())
    ]

    recent_expenses = expense_qs.order_by("-expense_date")[:10]
    recent_deposits = deposit_qs.order_by("-deposit_date")[:10]
    recent_transfers = transfer_qs.order_by("-transfer_date")[:10]

    recent_activity = sorted(
        [
            *[
                {"type": "expense", "description": e.category, "amount_brl": e.amount, "date": str(e.expense_date)}
                for e in recent_expenses
            ],
            *[
                {
                    "type": "deposit",
                    "description": d.invoice_number,
                    "amount_brl": d.amount_brl,
                    "date": str(d.deposit_date),
                }
                for d in recent_deposits
            ],
            *[
                {
                    "type": "transfer",
                    "description": t.bank_name,
                    "amount_brl": t.amount_brl,
                    "date": str(t.transfer_date),
                }
                for t in recent_transfers
            ],
        ],
        key=lambda x: x["date"],
        reverse=True,
    )[:10]

    settings.LOG.info(
        f"Dashboard data: income_brl={total_income_brl}, income_usd={total_income_usd}, "
        f"expenses={total_expenses}, transferred={total_transferred}, "
        f"months={len(monthly)}, recent_activity={len(recent_activity)}"
    )

    return {
        "year": year,
        "month": month,
        "summary": {
            "total_income_brl": total_income_brl,
            "total_income_usd": total_income_usd,
            "total_expenses_brl": total_expenses,
            "total_transferred_brl": total_transferred,
            "net_balance_brl": total_income_brl - total_expenses,
        },
        "monthly": monthly,
        "recent_activity": recent_activity,
    }
