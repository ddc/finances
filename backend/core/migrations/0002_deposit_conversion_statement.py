from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="deposit",
            name="conversion_file",
            field=models.BinaryField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="deposit",
            name="conversion_filename",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
