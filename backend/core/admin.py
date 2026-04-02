from core.models import Deposit, Expense, NfeSample, Transfer
from django.contrib import admin


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("expense_date", "category", "amount", "created_by", "created_at")
    list_filter = ("category",)


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ("invoice_number", "deposit_date", "amount_usd", "amount_brl", "created_at")


@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):
    list_display = ("bank_name", "transfer_date", "amount_brl", "deposit", "created_at")
    list_filter = ("bank_name",)


@admin.register(NfeSample)
class NfeSampleAdmin(admin.ModelAdmin):
    list_display = ("description", "created_by", "created_at")
    search_fields = ("description", "body")
