from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    # Admin
    ADMIN_USERNAME: str = Field(default="admin")
    ADMIN_PASSWORD: str = Field(default="admin123")

    # Auth
    TOKEN_EXPIRY_HOURS: int = Field(default=1)

    # Frontend App Port
    FRONTEND_PORT: int = Field(default=443)

    # Seed data (comma-separated)
    SEED_CURRENCIES: str = Field(
        default="USD:US Dollar:$,EUR:Euro:\u20ac,GBP:British Pound:\u00a3,CAD:Canadian Dollar:C$,AUD:Australian Dollar:A$"
    )
    SEED_CATEGORIES: str = Field(
        default="OFFICE:Office,ACCOUNTING:Accounting,TAXES:Taxes,HEALTHCARE_PLAN:Healthcare Plan,OTHER:Other"
    )
    SEED_SUB_CATEGORIES: str = Field(
        default="OFFICE:RENT:Rent,ACCOUNTING:ACCOUNTANT:Accountant,TAXES:TFE:TFE,HEALTHCARE_PLAN:MEDICAL:Medical,HEALTHCARE_PLAN:DENTAL:Dental"
    )
    SEED_BANKS: str = Field(default="BANK_OF_AMERICA:Bank of America")
    SEED_COMPANIES: str = Field(default="OTHER:Other")

    # Database
    POSTGRES_HOST: str = Field(default="localhost")
    POSTGRES_PORT: int = Field(default=5432)
    POSTGRES_DB: str = Field(default="finances")
    POSTGRES_USER: str = Field(default="finances")
    POSTGRES_PASSWORD: str = Field(default="finances")

    # Django
    DJANGO_DEBUG: bool = Field(default=True)
    DJANGO_SECRET_KEY: str = Field(default="dev-insecure-key")
    DJANGO_ALLOWED_HOSTS: str = Field(default="localhost,127.0.0.1")
    DJANGO_TIME_ZONE: str = Field(default="UTC")

    # PTAX
    PTAX_CACHE_TTL_SECONDS: int = Field(default=3600)
    PTAX_API_URL: str = Field(default="https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="allow")
