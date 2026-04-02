from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0003_expense_expense_date"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="nfesample",
            name="nfe_number",
        ),
        migrations.AddField(
            model_name="nfesample",
            name="description",
            field=models.CharField(blank=True, default="", max_length=200),
        ),
    ]
