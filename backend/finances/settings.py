from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from pythonlogs import TimedRotatingLog


class AppSettings(BaseSettings):
    # Database
    POSTGRES_HOST: str = Field(default="localhost")
    POSTGRES_PORT: int = Field(default=5432)
    POSTGRES_DB: str = Field(default="finances")
    POSTGRES_USER: str = Field(default="finances")
    POSTGRES_PASSWORD: str = Field(default="finances")

    # Frontend App Port
    FINANCES_PORT: int = Field(default=8888)

    # Django
    DJANGO_DEBUG: bool = Field(default=True)
    DJANGO_SECRET_KEY: str = Field(default="dev-insecure-key")
    DJANGO_ALLOWED_HOSTS: str = Field(default="localhost,127.0.0.1")
    DJANGO_TIME_ZONE: str = Field(default="UTC")

    # PTAX
    PTAX_CACHE_TTL_SECONDS: int = Field(default=3600)
    PTAX_API_URL: str = Field(default="https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="allow")


env = AppSettings()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = env.DJANGO_SECRET_KEY
DEBUG = env.DJANGO_DEBUG
ALLOWED_HOSTS = env.DJANGO_ALLOWED_HOSTS.split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "finances.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "finances.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env.POSTGRES_DB,
        "USER": env.POSTGRES_USER,
        "PASSWORD": env.POSTGRES_PASSWORD,
        "HOST": env.POSTGRES_HOST,
        "PORT": str(env.POSTGRES_PORT),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = env.DJANGO_TIME_ZONE
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

PTAX_API_URL = env.PTAX_API_URL
PTAX_CACHE_TTL_SECONDS = env.PTAX_CACHE_TTL_SECONDS

LOGGING_CONFIG = None

LOG = TimedRotatingLog()
