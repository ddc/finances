from core.models import Bank, Currency, Deposit, Expense, ExpenseCategory, NfeSample, Transfer
from django.contrib import admin


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ("code", "label")
    search_fields = ("code", "label")


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ("code", "label", "symbol")
    search_fields = ("code", "label")


@admin.register(Bank)
class BankAdmin(admin.ModelAdmin):
    list_display = ("code", "label")
    search_fields = ("code", "label")


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("expense_date", "category", "amount", "created_by", "created_at")
    list_filter = ("category",)


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ("invoice_number", "deposit_date", "currency", "amount_foreign", "amount_brl", "created_at")
    list_filter = ("currency",)


@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):
    list_display = ("bank", "transfer_date", "amount_brl", "deposit", "created_at")
    list_filter = ("bank",)


@admin.register(NfeSample)
class NfeSampleAdmin(admin.ModelAdmin):
    list_display = ("description", "created_by", "created_at")
    search_fields = ("description", "body")
