import pytest
from core.models import Bank, Company, Currency, ExpenseCategory
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient
from testcontainers.postgres import PostgresContainer
from tests.conftest import TEST_USER_PASSWORD


@pytest.fixture(scope="session")
def postgres_container():
    with PostgresContainer("postgres:18.3-alpine3.23") as pg:
        yield pg


@pytest.fixture(autouse=True)
def _setup_db(postgres_container, settings):
    settings.DATABASES["default"] = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": postgres_container.dbname,
        "USER": postgres_container.username,
        "PASSWORD": postgres_container.password,
        "HOST": postgres_container.get_container_host_ip(),
        "PORT": postgres_container.get_exposed_port(5432),
        "ATOMIC_REQUESTS": False,
        "AUTOCOMMIT": True,
        "CONN_MAX_AGE": 0,
        "CONN_HEALTH_CHECKS": False,
        "OPTIONS": {},
        "TIME_ZONE": None,
        "TEST": {
            "CHARSET": None,
            "COLLATION": None,
            "MIGRATE": True,
            "MIRROR": None,
            "NAME": None,
        },
    }


@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(username="admin", password=TEST_USER_PASSWORD, is_staff=True)
    return user


@pytest.fixture
def viewer_user(db):
    user = User.objects.create_user(username="viewer", password=TEST_USER_PASSWORD, is_staff=False)
    return user


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    token, _ = Token.objects.get_or_create(user=admin_user)
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


@pytest.fixture
def viewer_client(viewer_user):
    client = APIClient()
    token, _ = Token.objects.get_or_create(user=viewer_user)
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


@pytest.fixture
def expense_category(db):
    return ExpenseCategory.objects.create(code="TAXES", label="Taxes")


@pytest.fixture
def currency(db):
    return Currency.objects.create(code="USD", label="US Dollar", symbol="$")


@pytest.fixture
def company(db):
    return Company.objects.create(code="DEEL", label="Deel")


@pytest.fixture
def bank(db):
    return Bank.objects.create(code="SANTANDER", label="Santander")
