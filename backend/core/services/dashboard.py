from core.models import Currency, Deposit, Expense, Transfer
from decimal import Decimal
from django.conf import settings
from django.db.models import Sum
from django.db.models.functions import ExtractMonth


def get_dashboard_data(year, month=None):
    settings.LOG.info("Building dashboard data: year=" + str(year) + ", month=" + str(month))
    deposit_qs = Deposit.objects.filter(deposit_date__year=year)
    expense_qs = Expense.objects.filter(expense_date__year=year)
    transfer_qs = Transfer.objects.filter(transfer_date__year=year)

    if month:
        deposit_qs = deposit_qs.filter(deposit_date__month=month)
        expense_qs = expense_qs.filter(expense_date__month=month)
        transfer_qs = transfer_qs.filter(transfer_date__month=month)

    # Income per currency
    income_by_currency = {}
    for curr in Currency.objects.all():
        total = deposit_qs.filter(currency=curr).aggregate(total=Sum("amount_foreign"))["total"] or Decimal("0")
        income_by_currency[curr.code] = total

    total_income_brl = deposit_qs.aggregate(total=Sum("amount_brl"))["total"] or Decimal("0")
    total_expenses = expense_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0")
    total_transferred = transfer_qs.aggregate(total=Sum("amount_brl"))["total"] or Decimal("0")

    monthly_income = (
        deposit_qs.annotate(month=ExtractMonth("deposit_date"))
        .values("month")
        .annotate(income_brl=Sum("amount_brl"), income_foreign=Sum("amount_foreign"))
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
        months.setdefault(row["month"], {})["income_foreign"] = row["income_foreign"]
    for row in monthly_expenses:
        months.setdefault(row["month"], {})["expenses_brl"] = row["expenses_brl"]
    for row in monthly_transferred:
        months.setdefault(row["month"], {})["transferred_brl"] = row["transferred_brl"]

    monthly = [
        {
            "month": m,
            "income_brl": data.get("income_brl", Decimal("0")),
            "income_foreign": data.get("income_foreign", Decimal("0")),
            "expenses_brl": data.get("expenses_brl", Decimal("0")),
            "transferred_brl": data.get("transferred_brl", Decimal("0")),
        }
        for m, data in sorted(months.items())
    ]

    recent_expenses = expense_qs.select_related("category").order_by("-expense_date")[:30]
    recent_deposits = deposit_qs.order_by("-deposit_date")[:30]
    recent_transfers = transfer_qs.select_related("bank").order_by("-transfer_date")[:30]

    recent_activity = sorted(
        [
            *[
                {
                    "type": "expense",
                    "description": e.category.label,
                    "amount_brl": e.amount,
                    "date": str(e.expense_date),
                }
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
                    "description": t.bank.label,
                    "amount_brl": t.amount_brl,
                    "date": str(t.transfer_date),
                }
                for t in recent_transfers
            ],
        ],
        key=lambda x: x["date"],
        reverse=True,
    )[:30]

    settings.LOG.info(
        "Dashboard data: income_brl="
        + str(total_income_brl)
        + ", expenses="
        + str(total_expenses)
        + ", transferred="
        + str(total_transferred)
        + ", months="
        + str(len(monthly))
        + ", recent_activity="
        + str(len(recent_activity))
    )

    return {
        "year": year,
        "month": month,
        "summary": {
            "income_by_currency": income_by_currency,
            "total_income_brl": total_income_brl,
            "total_expenses_brl": total_expenses,
            "total_transferred_brl": total_transferred,
            "net_balance_brl": total_income_brl - total_expenses,
        },
        "monthly": monthly,
        "recent_activity": recent_activity,
    }
