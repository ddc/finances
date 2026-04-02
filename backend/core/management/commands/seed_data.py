from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create initial admin user"

    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={"is_staff": True, "is_superuser": True},
        )
        if created:
            admin.set_password("admin123")
            admin.save()
            self.stdout.write(self.style.SUCCESS("Created admin user (username: admin, password: admin123)"))
        else:
            self.stdout.write("Admin user already exists")
