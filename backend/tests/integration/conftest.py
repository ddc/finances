import pytest
from testcontainers.postgres import PostgresContainer


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
