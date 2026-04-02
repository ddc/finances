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


class Expense(BaseModel):
    class CategoryChoices(models.TextChoices):
        IMPOSTOS = "IMPOSTOS", "Impostos"
        PLANO_SAUDE = "PLANO_SAUDE", "Plano de Saúde"
        CONTABILIDADE = "CONTABILIDADE", "Contabilidade"
        OTHER = "OTHER", "Other"

    expense_date = models.DateField()
    category = models.CharField(max_length=20, choices=CategoryChoices.choices)
    description = models.TextField(blank=True, default="")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="expenses")

    def __str__(self):
        return f"{self.category} - R${self.amount}"


class Deposit(BaseModel):
    deposit_date = models.DateField()
    invoice_number = models.CharField(max_length=100)
    invoice_issue_date = models.DateField()
    period_start = models.DateField()
    period_end = models.DateField()
    amount_usd = models.DecimalField(max_digits=10, decimal_places=2)
    amount_brl = models.DecimalField(max_digits=10, decimal_places=2)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="deposits")

    def __str__(self):
        return f"{self.invoice_number} - ${self.amount_usd}"


class Transfer(BaseModel):
    class BankChoices(models.TextChoices):
        SANTANDER = "SANTANDER", "Santander"

    transfer_date = models.DateField()
    deposit = models.ForeignKey(Deposit, on_delete=models.CASCADE, related_name="transfers")
    bank_name = models.CharField(max_length=20, choices=BankChoices.choices)
    amount_brl = models.DecimalField(max_digits=10, decimal_places=2)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transfers")

    def __str__(self):
        return f"{self.bank_name} - R${self.amount_brl}"


class NfeSample(BaseModel):
    description = models.CharField(max_length=200, blank=True, default="")
    body = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="nfes")

    def __str__(self):
        return self.description or f"NFE {self.pk}"
