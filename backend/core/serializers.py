from core.constants.messages import END_PERIOD_BEFORE_START, SUB_CATEGORY_PARENT_MISMATCH
from core.models import (
    Bank,
    Company,
    Currency,
    Deposit,
    Expense,
    ExpenseCategory,
    ExpenseSubCategory,
    NfeSample,
    Transfer,
)
from django.contrib.auth.models import User
from rest_framework import serializers


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ["id", "code", "label"]


class ExpenseSubCategorySerializer(serializers.ModelSerializer):
    parent_code = serializers.CharField(source="parent.code", read_only=True)

    class Meta:
        model = ExpenseSubCategory
        fields = ["id", "parent", "parent_code", "code", "label"]
        read_only_fields = ["id", "parent_code"]


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ["id", "code", "label", "symbol"]


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ["id", "code", "label"]


class BankSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bank
        fields = ["id", "code", "label"]


class ExpenseSerializer(serializers.ModelSerializer):
    category_code = serializers.CharField(source="category.code", read_only=True)
    category_label = serializers.CharField(source="category.label", read_only=True)
    sub_category = serializers.PrimaryKeyRelatedField(
        queryset=ExpenseSubCategory.objects.all(), required=False, allow_null=True
    )
    sub_category_code = serializers.CharField(source="sub_category.code", read_only=True, default=None)
    sub_category_label = serializers.CharField(source="sub_category.label", read_only=True, default=None)
    has_receipt_file = serializers.SerializerMethodField()
    has_nfe_file = serializers.SerializerMethodField()
    has_payment_file = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            "id",
            "expense_date",
            "category",
            "category_code",
            "category_label",
            "sub_category",
            "sub_category_code",
            "sub_category_label",
            "description",
            "amount",
            "has_receipt_file",
            "has_nfe_file",
            "has_payment_file",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
            "category_code",
            "category_label",
            "sub_category_code",
            "sub_category_label",
        ]

    @staticmethod
    def get_has_receipt_file(obj):
        return bool(obj.receipt_file)

    @staticmethod
    def get_has_nfe_file(obj):
        return bool(obj.nfe_file)

    @staticmethod
    def get_has_payment_file(obj):
        return bool(obj.payment_file)

    def validate(self, attrs):
        category = attrs.get("category")
        sub_category = attrs.get("sub_category")
        if sub_category and category and sub_category.parent_id != category.id:
            raise serializers.ValidationError({"sub_category": SUB_CATEGORY_PARENT_MISMATCH})
        return attrs


class DepositSerializer(serializers.ModelSerializer):
    period_start = serializers.DateField(required=False, allow_null=True)
    period_end = serializers.DateField(required=False, allow_null=True)
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    exchange_rate = serializers.DecimalField(max_digits=10, decimal_places=4, required=False, allow_null=True)
    exchange_rate_effective = serializers.DecimalField(max_digits=10, decimal_places=4, required=False, allow_null=True)
    spread = serializers.DecimalField(max_digits=10, decimal_places=4, required=False, allow_null=True)
    operation_cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    financial_operation_tax = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    has_nfe_file = serializers.SerializerMethodField()
    has_invoice_file = serializers.SerializerMethodField()
    has_transaction_file = serializers.SerializerMethodField()
    has_conversion_file = serializers.SerializerMethodField()
    company_code = serializers.CharField(source="company.code", read_only=True)
    company_label = serializers.CharField(source="company.label", read_only=True)
    currency_code = serializers.CharField(source="currency.code", read_only=True)
    currency_symbol = serializers.CharField(source="currency.symbol", read_only=True)

    class Meta:
        model = Deposit
        fields = [
            "id",
            "deposit_date",
            "company",
            "company_code",
            "company_label",
            "invoice_number",
            "period_start",
            "period_end",
            "currency",
            "currency_code",
            "currency_symbol",
            "exchange_rate",
            "exchange_rate_effective",
            "spread",
            "operation_cost",
            "financial_operation_tax",
            "amount_foreign",
            "amount_brl",
            "has_nfe_file",
            "has_invoice_file",
            "has_transaction_file",
            "has_conversion_file",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
            "company_code",
            "company_label",
            "currency_code",
            "currency_symbol",
        ]

    @staticmethod
    def get_has_nfe_file(obj):
        return bool(obj.nfe_file)

    @staticmethod
    def get_has_invoice_file(obj):
        return bool(obj.invoice_file)

    @staticmethod
    def get_has_transaction_file(obj):
        return bool(obj.transaction_file)

    @staticmethod
    def get_has_conversion_file(obj):
        return bool(obj.conversion_file)

    def validate(self, attrs):
        start = attrs.get("period_start")
        end = attrs.get("period_end")
        if start and end and end < start:
            raise serializers.ValidationError({"period_end": END_PERIOD_BEFORE_START})
        return attrs


class TransferSerializer(serializers.ModelSerializer):
    has_transfer_file = serializers.SerializerMethodField()
    bank_code = serializers.CharField(source="bank.code", read_only=True)
    bank_label = serializers.CharField(source="bank.label", read_only=True)

    class Meta:
        model = Transfer
        fields = [
            "id",
            "transfer_date",
            "bank",
            "bank_code",
            "bank_label",
            "amount_brl",
            "description",
            "has_transfer_file",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at", "bank_code", "bank_label"]

    @staticmethod
    def get_has_transfer_file(obj):
        return bool(obj.transfer_file)


class NfeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NfeSample
        fields = ["id", "description", "body", "created_by", "created_at", "updated_at"]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "role"]

    @staticmethod
    def get_role(obj):
        return "admin" if obj.is_staff else "viewer"


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
