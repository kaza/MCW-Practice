# Generated by Django 5.0.10 on 2024-12-23 21:33

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('clinician_dashboard', '0018_appointmentstate_background_color_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='appointmentstate',
            name='background_color',
        ),
        migrations.RemoveField(
            model_name='appointmentstate',
            name='color',
        ),
    ]
