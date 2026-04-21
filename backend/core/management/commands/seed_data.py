from core.models import Bank, Company, Currency, ExpenseCategory, ExpenseSubCategory
from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create initial admin user and seed lookup tables"

    _LOG_LEVEL_MAP = {"success": "info", "warning": "warning", "error": "error", "info": "info"}

    def _log(self, msg, level="info"):
        style_fn = getattr(self.style, level.upper(), None)
        self.stdout.write(style_fn(msg) if style_fn else msg)
        log_level = self._LOG_LEVEL_MAP.get(level, "info")
        getattr(settings.LOG, log_level)(msg)

    def _seed_admin(self, env):
        admin, created = User.objects.get_or_create(
            username=env.ADMIN_USERNAME,
            defaults={"is_staff": True, "is_superuser": True},
        )
        if created:
            admin.set_password(env.ADMIN_PASSWORD)
            admin.save()
            self._log("Created admin user: " + env.ADMIN_USERNAME, "success")
        else:
            self._log("Admin user already exists", "warning")

    def _seed_categories(self, env):
        for entry in env.SEED_CATEGORIES.split(","):
            parts = entry.strip().split(":")
            if len(parts) >= 2:
                _, created = ExpenseCategory.objects.get_or_create(code=parts[0], defaults={"label": parts[1]})
                if created:
                    self._log("  Created category: " + parts[0])

    def _seed_sub_categories(self, env):
        raw = getattr(env, "SEED_SUB_CATEGORIES", "") or ""
        for entry in raw.split(","):
            parts = entry.strip().split(":")
            if len(parts) >= 3:
                parent = ExpenseCategory.objects.filter(code=parts[0]).first()
                if parent is None:
                    self._log("  Skipped sub-category (unknown parent): " + parts[0], "warning")
                    continue
                _, created = ExpenseSubCategory.objects.get_or_create(
                    parent=parent, code=parts[1], defaults={"label": parts[2]}
                )
                if created:
                    self._log("  Created sub-category: " + parts[0] + "/" + parts[1])

    def _seed_currencies(self, env):
        for entry in env.SEED_CURRENCIES.split(","):
            parts = entry.strip().split(":")
            if len(parts) >= 3:
                _, created = Currency.objects.get_or_create(
                    code=parts[0], defaults={"label": parts[1], "symbol": parts[2]}
                )
                if created:
                    self._log("  Created currency: " + parts[0])

    def _seed_companies(self, env):
        for entry in env.SEED_COMPANIES.split(","):
            parts = entry.strip().split(":")
            if len(parts) >= 2:
                _, created = Company.objects.get_or_create(code=parts[0], defaults={"label": parts[1]})
                if created:
                    self._log("  Created company: " + parts[0])

    def _seed_banks(self, env):
        for entry in env.SEED_BANKS.split(","):
            parts = entry.strip().split(":")
            if len(parts) >= 2:
                _, created = Bank.objects.get_or_create(code=parts[0], defaults={"label": parts[1]})
                if created:
                    self._log("  Created bank: " + parts[0])

    def handle(self, *args, **options):
        self._log("Running seed_data command")
        self._seed_admin(settings.ENV)
        self._seed_categories(settings.ENV)
        self._seed_sub_categories(settings.ENV)
        self._seed_currencies(settings.ENV)
        self._seed_companies(settings.ENV)
        self._seed_banks(settings.ENV)
        self._log("Seed data loaded", "success")
