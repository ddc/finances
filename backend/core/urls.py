from core.views import (
    DashboardView,
    DepositViewSet,
    ExpenseViewSet,
    LoginView,
    LogoutView,
    MeView,
    NfeSampleViewSet,
    TransferViewSet,
)
from django.urls import include, path
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"expenses", ExpenseViewSet)
router.register(r"deposits", DepositViewSet)
router.register(r"transfers", TransferViewSet)
router.register(r"nfe-samples", NfeSampleViewSet)

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("", include(router.urls)),
]
