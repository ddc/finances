import datetime
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_nfesample"),
    ]

    operations = [
        migrations.AddField(
            model_name="expense",
            name="expense_date",
            field=models.DateField(default=datetime.date(2026, 1, 1)),
            preserve_default=False,
        ),
    ]
