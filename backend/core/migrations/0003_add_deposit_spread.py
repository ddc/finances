from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_add_deposit_conversion_file"),
    ]

    operations = [
        migrations.AddField(
            model_name="deposit",
            name="spread",
            field=models.DecimalField(blank=True, decimal_places=4, max_digits=10, null=True),
        ),
    ]
