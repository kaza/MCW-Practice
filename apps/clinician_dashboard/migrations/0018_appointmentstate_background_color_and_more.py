# Generated by Django 5.0.10 on 2024-12-23 20:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clinician_dashboard', '0017_eventservice_fee_eventservice_modifiers'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointmentstate',
            name='background_color',
            field=models.CharField(default='', max_length=7),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='appointmentstate',
            name='color',
            field=models.CharField(default='', max_length=7),
            preserve_default=False,
        ),
    ]
