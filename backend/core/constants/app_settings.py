from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    # Admin
    ADMIN_USERNAME: str = Field(default="admin")
    ADMIN_PASSWORD: str = Field(default="admin123")

    # Auth
    TOKEN_EXPIRY_HOURS: int = Field(default=1)

    # Frontend App Port
    FRONTEND_PORT: int = Field(default=8888)

    # Seed data (comma-separated)
    SEED_CATEGORIES: str = Field(
        default="TAXES:Taxes,HEALTH_INSURANCE:Health Insurance,ACCOUNTING:Accounting,TFE:TFE,OTHER:Other"
    )
    SEED_CURRENCIES: str = Field(
        default="USD:US Dollar:$,EUR:Euro:\u20ac,GBP:British Pound:\u00a3,CAD:Canadian Dollar:C$,AUD:Australian Dollar:A$"
    )
    SEED_COMPANIES: str = Field(default="DEEL:Deel,OTHER:Other")
    SEED_BANKS: str = Field(default="SANTANDER:Santander")

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
