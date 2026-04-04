import uuid
import uuid_utils
from django.conf import settings
from django.db import models


def generate_uuid7():
    return uuid.UUID(bytes=uuid_utils.uuid7().bytes)


class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=generate_uuid7, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ExpenseCategory(BaseModel):
    code = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = "Expense Categories"
        ordering = ["label"]

    def __str__(self):
        return self.label


class Currency(BaseModel):
    code = models.CharField(max_length=10, unique=True)
    label = models.CharField(max_length=100)
    symbol = models.CharField(max_length=10, blank=True, default="")

    class Meta:
        verbose_name_plural = "Currencies"
        ordering = ["code"]

    def __str__(self):
        return self.code + " - " + self.label


class Company(BaseModel):
    code = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = "Companies"
        ordering = ["label"]

    def __str__(self):
        return self.label


class Bank(BaseModel):
    code = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)

    class Meta:
        ordering = ["label"]

    def __str__(self):
        return self.label


class Expense(BaseModel):
    expense_date = models.DateField()
    category = models.ForeignKey(ExpenseCategory, on_delete=models.PROTECT, related_name="expenses")
    description = models.TextField(blank=True, default="")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="expenses")

    def __str__(self):
        return str(self.category) + " - R$" + str(self.amount)


class Deposit(BaseModel):
    deposit_date = models.DateField()
    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="deposits")
    invoice_number = models.CharField(max_length=100, blank=True, default="")
    invoice_issue_date = models.DateField(null=True, blank=True)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name="deposits")
    amount_foreign = models.DecimalField(max_digits=10, decimal_places=2)
    amount_brl = models.DecimalField(max_digits=10, decimal_places=2)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="deposits")

    def __str__(self):
        return self.invoice_number + " - " + str(self.currency.code) + " " + str(self.amount_foreign)


class Transfer(BaseModel):
    transfer_date = models.DateField()
    deposit = models.ForeignKey(Deposit, on_delete=models.CASCADE, related_name="transfers")
    bank = models.ForeignKey(Bank, on_delete=models.PROTECT, related_name="transfers")
    amount_brl = models.DecimalField(max_digits=10, decimal_places=2)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transfers")

    def __str__(self):
        return str(self.bank) + " - R$" + str(self.amount_brl)


class NfeSample(BaseModel):
    description = models.CharField(max_length=200, blank=True, default="")
    body = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="nfes")

    def __str__(self):
        return self.description or "NFE " + str(self.pk)
