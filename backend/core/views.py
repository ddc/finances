from core.constants.messages import INVALID_CREDENTIALS
from core.models import Bank, Company, Currency, Deposit, Expense, ExpenseCategory, NfeSample, Transfer
from core.permissions import IsAdminOrReadOnly
from core.serializers import (
    BankSerializer,
    CompanySerializer,
    CurrencySerializer,
    DepositSerializer,
    ExpenseCategorySerializer,
    ExpenseSerializer,
    LoginSerializer,
    NfeSerializer,
    TransferSerializer,
    UserSerializer,
)
from core.services.dashboard import get_dashboard_data
from core.services.ptax import get_ptax_rate
from django.conf import settings
from django.contrib.auth import authenticate
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class LoggingModelViewSet(viewsets.ModelViewSet):
    """Base ViewSet that logs all CRUD operations including validation errors."""

    def create(self, request, *args, **kwargs):
        settings.LOG.info(self.__class__.__name__ + " CREATE by " + str(request.user) + ": " + str(request.data))
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            settings.LOG.warning(self.__class__.__name__ + " validation error: " + str(serializer.errors))
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        settings.LOG.info(
            self.__class__.__name__
            + " UPDATE by "
            + str(request.user)
            + " id="
            + str(kwargs.get("pk"))
            + ": "
            + str(request.data)
        )
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            settings.LOG.warning(self.__class__.__name__ + " validation error: " + str(serializer.errors))
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        settings.LOG.info(
            self.__class__.__name__
            + " DELETE by "
            + str(request.user)
            + " id="
            + str(instance.pk)
            + ": "
            + str(instance)
        )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        settings.LOG.debug(self.__class__.__name__ + " RETRIEVE by " + str(request.user) + " id=" + str(instance.pk))
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        settings.LOG.debug(
            self.__class__.__name__
            + " LIST by "
            + str(request.user)
            + " params="
            + str(dict(request.query_params))
            + " count="
            + str(qs.count())
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if not user:
            settings.LOG.warning("Failed login attempt for: " + serializer.validated_data["username"])
            return Response({"detail": INVALID_CREDENTIALS}, status=status.HTTP_401_UNAUTHORIZED)
        # Delete old token if exists, create fresh one (resets expiry)
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)
        settings.LOG.info("User logged in: " + user.username)
        response = Response({"user": UserSerializer(user).data})
        response.set_cookie(
            key="auth_token",
            value=token.key,
            httponly=True,
            secure=True,
            samesite="Lax",
            max_age=settings.ENV.TOKEN_EXPIRY_HOURS * 3600,
            path="/",
        )
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        settings.LOG.info("User logged out: " + request.user.username)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie("auth_token", path="/")
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year_param = request.query_params.get("year")
        year = int(year_param) if year_param else None
        month_param = request.query_params.get("month")
        month = int(month_param) if month_param else None
        currency = request.query_params.get("currency", "USD").upper()
        settings.LOG.info(
            "Dashboard requested by "
            + request.user.username
            + ": year="
            + str(year)
            + ", month="
            + str(month)
            + ", currency="
            + currency
        )
        data = get_dashboard_data(year, month=month)
        ptax = get_ptax_rate(currency)
        data["currency"] = currency
        if ptax:
            data["ptax_compra"] = str(ptax["compra"])
            data["ptax_venda"] = str(ptax["venda"])
            data["ptax_data_hora"] = ptax.get("data_hora", "")
        else:
            data["ptax_compra"] = None
            data["ptax_venda"] = None
            data["ptax_data_hora"] = None
        return Response(data)


class ExpenseViewSet(LoggingModelViewSet):
    queryset = Expense.objects.all().order_by("-expense_date")
    serializer_class = ExpenseSerializer
    permission_classes = [IsAdminOrReadOnly]

    def _save_files(self, instance, request):
        receipt = request.FILES.get("receipt_file")
        nfe = request.FILES.get("nfe_file")
        if receipt:
            instance.receipt_file = receipt.read()
            instance.receipt_filename = receipt.name
        if nfe:
            instance.nfe_file = nfe.read()
            instance.nfe_filename = nfe.name
        if receipt or nfe:
            instance.save()

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        self._save_files(instance, self.request)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._save_files(instance, self.request)

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")
        if category:
            qs = qs.filter(category__code=category)
        if year:
            qs = qs.filter(expense_date__year=year)
        if month:
            qs = qs.filter(expense_date__month=month)
        return qs


class DepositViewSet(LoggingModelViewSet):
    queryset = Deposit.objects.all().order_by("-deposit_date")
    serializer_class = DepositSerializer
    permission_classes = [IsAdminOrReadOnly]

    def _save_files(self, instance, request):
        nfe = request.FILES.get("nfe_file")
        invoice = request.FILES.get("invoice_file")
        if nfe:
            instance.nfe_file = nfe.read()
            instance.nfe_filename = nfe.name
        if invoice:
            instance.invoice_file = invoice.read()
            instance.invoice_filename = invoice.name
        if nfe or invoice:
            instance.save()

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        self._save_files(instance, self.request)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._save_files(instance, self.request)

    def get_queryset(self):
        qs = super().get_queryset()
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")
        if year:
            qs = qs.filter(deposit_date__year=year)
        if month:
            qs = qs.filter(deposit_date__month=month)
        return qs


class TransferViewSet(LoggingModelViewSet):
    queryset = Transfer.objects.all().order_by("-transfer_date")
    serializer_class = TransferSerializer
    permission_classes = [IsAdminOrReadOnly]

    def _save_file(self, instance, request):
        f = request.FILES.get("transfer_file")
        if f:
            instance.transfer_file = f.read()
            instance.transfer_filename = f.name
            instance.save()

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        self._save_file(instance, self.request)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._save_file(instance, self.request)

    def get_queryset(self):
        qs = super().get_queryset()
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")
        bank = self.request.query_params.get("bank")
        if year:
            qs = qs.filter(transfer_date__year=year)
        if month:
            qs = qs.filter(transfer_date__month=month)
        if bank:
            qs = qs.filter(bank__code=bank)
        return qs


class ExpenseCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated]


class CurrencyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [IsAuthenticated]


class CompanyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]


class BankViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Bank.objects.all()
    serializer_class = BankSerializer
    permission_classes = [IsAuthenticated]


class NfeSampleViewSet(LoggingModelViewSet):
    queryset = NfeSample.objects.all().order_by("-created_at")
    serializer_class = NfeSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")
        if year:
            qs = qs.filter(created_at__year=year)
        if month:
            qs = qs.filter(created_at__month=month)
        return qs


def _pdf_response(file_data, filename):
    response = HttpResponse(bytes(file_data), content_type="application/pdf")
    response["Content-Disposition"] = 'inline; filename="' + filename + '"'
    return response


class ExpenseFileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, file_type):
        expense = Expense.objects.get(pk=pk)
        if file_type == "receipt":
            file_data = expense.receipt_file
            filename = expense.receipt_filename
        elif file_type == "nfe":
            file_data = expense.nfe_file
            filename = expense.nfe_filename
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not file_data:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return _pdf_response(file_data, filename or str(pk) + "_" + file_type + ".pdf")


class DepositFileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, file_type):
        deposit = Deposit.objects.get(pk=pk)
        if file_type == "nfe":
            file_data = deposit.nfe_file
            filename = deposit.nfe_filename
        elif file_type == "invoice":
            file_data = deposit.invoice_file
            filename = deposit.invoice_filename
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not file_data:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return _pdf_response(file_data, filename or str(pk) + "_" + file_type + ".pdf")


class TransferFileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        transfer = Transfer.objects.get(pk=pk)
        if not transfer.transfer_file:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return _pdf_response(transfer.transfer_file, transfer.transfer_filename or str(pk) + "_transfer.pdf")
