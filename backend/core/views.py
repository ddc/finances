from core.models import Deposit, Expense, NfeSample, Transfer
from core.permissions import IsAdminOrReadOnly
from core.serializers import (
    DepositSerializer,
    ExpenseSerializer,
    LoginSerializer,
    NfeSerializer,
    TransferSerializer,
    UserSerializer,
)
from core.services.dashboard import get_dashboard_data
from core.services.ptax import get_ptax_rate
from datetime import datetime as dt
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if not user:
            settings.LOG.warning(f"Failed login attempt for: {serializer.validated_data['username']}")
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        token, _ = Token.objects.get_or_create(user=user)
        settings.LOG.info(f"User logged in: {user.username}")
        return Response({"token": token.key, "user": UserSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        settings.LOG.info(f"User logged out: {request.user.username}")
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = int(request.query_params.get("year", dt.now().year))
        month_param = request.query_params.get("month")
        month = int(month_param) if month_param else None
        settings.LOG.info(f"Dashboard requested by {request.user.username}: year={year}, month={month}")
        data = get_dashboard_data(year, month=month)
        ptax = get_ptax_rate()
        if ptax:
            data["ptax_compra"] = str(ptax["compra"])
            data["ptax_venda"] = str(ptax["venda"])
            data["ptax_fetched_at"] = dt.now().isoformat()
        else:
            data["ptax_compra"] = None
            data["ptax_venda"] = None
            data["ptax_fetched_at"] = None
        return Response(data)


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by("-expense_date")
    serializer_class = ExpenseSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        settings.LOG.info(f"Expense created by {self.request.user.username}: {instance.category} R${instance.amount}")

    def perform_update(self, serializer):
        instance = serializer.save()
        settings.LOG.info(
            f"Expense updated by {self.request.user.username}: {instance.id} {instance.category} R${instance.amount}"
        )

    def perform_destroy(self, instance):
        settings.LOG.info(
            f"Expense deleted by {self.request.user.username}: {instance.id} {instance.category} R${instance.amount}"
        )
        instance.delete()

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")
        if category:
            qs = qs.filter(category=category)
        if year:
            qs = qs.filter(expense_date__year=year)
        if month:
            qs = qs.filter(expense_date__month=month)
        return qs


class DepositViewSet(viewsets.ModelViewSet):
    queryset = Deposit.objects.all().order_by("-deposit_date")
    serializer_class = DepositSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        settings.LOG.info(
            f"Deposit created by {self.request.user.username}: {instance.invoice_number} ${instance.amount_usd}"
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        settings.LOG.info(f"Deposit updated by {self.request.user.username}: {instance.id} {instance.invoice_number}")

    def perform_destroy(self, instance):
        settings.LOG.info(f"Deposit deleted by {self.request.user.username}: {instance.id} {instance.invoice_number}")
        instance.delete()

    def get_queryset(self):
        qs = super().get_queryset()
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")
        if year:
            qs = qs.filter(deposit_date__year=year)
        if month:
            qs = qs.filter(deposit_date__month=month)
        return qs


class TransferViewSet(viewsets.ModelViewSet):
    queryset = Transfer.objects.all().order_by("-transfer_date")
    serializer_class = TransferSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        settings.LOG.info(
            f"Transfer created by {self.request.user.username}: {instance.bank_name} R${instance.amount_brl}"
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        settings.LOG.info(f"Transfer updated by {self.request.user.username}: {instance.id} {instance.bank_name}")

    def perform_destroy(self, instance):
        settings.LOG.info(
            f"Transfer deleted by {self.request.user.username}: {instance.id} {instance.bank_name} R${instance.amount_brl}"
        )
        instance.delete()

    def get_queryset(self):
        qs = super().get_queryset()
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")
        bank = self.request.query_params.get("bank_name")
        if year:
            qs = qs.filter(transfer_date__year=year)
        if month:
            qs = qs.filter(transfer_date__month=month)
        if bank:
            qs = qs.filter(bank_name=bank)
        return qs


class NfeSampleViewSet(viewsets.ModelViewSet):
    queryset = NfeSample.objects.all().order_by("-created_at")
    serializer_class = NfeSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        settings.LOG.info(f"NFE sample created by {self.request.user.username}: {instance.description or instance.id}")

    def perform_update(self, serializer):
        instance = serializer.save()
        settings.LOG.info(f"NFE sample updated by {self.request.user.username}: {instance.id}")

    def perform_destroy(self, instance):
        settings.LOG.info(f"NFE sample deleted by {self.request.user.username}: {instance.id} {instance.description}")
        instance.delete()

    def get_queryset(self):
        qs = super().get_queryset()
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")
        if year:
            qs = qs.filter(created_at__year=year)
        if month:
            qs = qs.filter(created_at__month=month)
        return qs
