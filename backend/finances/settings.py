from core.constants.app_settings import AppSettings
from pathlib import Path
from pythonlogs import TimedRotatingLog

ENV = AppSettings()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = ENV.DJANGO_SECRET_KEY
DEBUG = ENV.DJANGO_DEBUG
ALLOWED_HOSTS = ENV.DJANGO_ALLOWED_HOSTS.split(",")
CSRF_TRUSTED_ORIGINS = []
for host in ENV.DJANGO_ALLOWED_HOSTS.split(","):
    host = host.strip()
    if host:
        for scheme in ("http", "https"):
            CSRF_TRUSTED_ORIGINS.append(scheme + "://" + host)
            CSRF_TRUSTED_ORIGINS.append(scheme + "://" + host + ":" + str(ENV.FRONTEND_PORT))

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
        "NAME": ENV.POSTGRES_DB,
        "USER": ENV.POSTGRES_USER,
        "PASSWORD": ENV.POSTGRES_PASSWORD,
        "HOST": ENV.POSTGRES_HOST,
        "PORT": str(ENV.POSTGRES_PORT),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = ENV.DJANGO_TIME_ZONE
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "core.authentication.CookieTokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

PTAX_API_URL = ENV.PTAX_API_URL
PTAX_CACHE_TTL_SECONDS = ENV.PTAX_CACHE_TTL_SECONDS

LOGGING_CONFIG = None

LOG = TimedRotatingLog()
