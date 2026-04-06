from core.views import (
    BankViewSet,
    CompanyViewSet,
    CurrencyViewSet,
    DashboardView,
    DepositFileView,
    DepositViewSet,
    ExpenseCategoryViewSet,
    ExpenseFileView,
    ExpenseViewSet,
    LoginView,
    LogoutView,
    MeView,
    NfeSampleViewSet,
    TransferFileView,
    TransferViewSet,
)
from django.urls import include, path
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"expense-categories", ExpenseCategoryViewSet)
router.register(r"currencies", CurrencyViewSet)
router.register(r"companies", CompanyViewSet)
router.register(r"banks", BankViewSet)
router.register(r"expenses", ExpenseViewSet)
router.register(r"deposits", DepositViewSet)
router.register(r"transfers", TransferViewSet)
router.register(r"nfe-samples", NfeSampleViewSet)

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("expenses/<uuid:pk>/file/", ExpenseFileView.as_view(), name="expense-file"),
    path("deposits/<uuid:pk>/file/<str:file_type>/", DepositFileView.as_view(), name="deposit-file"),
    path("transfers/<uuid:pk>/file/", TransferFileView.as_view(), name="transfer-file"),
    path("", include(router.urls)),
]
