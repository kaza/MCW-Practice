# Generated by Django 5.0.10 on 2025-01-04 20:04

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clinician_dashboard', '0023_notetemplate_sort_order'),
    ]

    operations = [
        migrations.AlterField(
            model_name='eventnote',
            name='created_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='clinician_dashboard.clinician'),
        ),
    ]
