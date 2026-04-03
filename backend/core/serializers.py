from core.models import Deposit, Expense, NfeSample, Transfer
from django.contrib.auth.models import User
from rest_framework import serializers


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ["id", "expense_date", "category", "description", "amount", "created_by", "created_at", "updated_at"]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class DepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deposit
        fields = [
            "id",
            "deposit_date",
            "invoice_number",
            "invoice_issue_date",
            "period_start",
            "period_end",
            "currency",
            "amount_foreign",
            "amount_brl",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class TransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transfer
        fields = [
            "id",
            "transfer_date",
            "deposit",
            "bank_name",
            "amount_brl",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


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

    def get_role(self, obj):
        return "admin" if obj.is_staff else "viewer"


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
