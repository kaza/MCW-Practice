from django.db import models
from django.forms import ValidationError
from django.conf import settings

class Location(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'Location'

class Speciality(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Specialities"
        db_table = 'Specialities'

class Group(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'Groups'

class Modality(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Modalities"
        db_table = 'Modalities'

class Clinician(models.Model):
    login_id = models.IntegerField()
    first_name = models.CharField(max_length=255, null=True)
    last_name = models.CharField(max_length=255, null=True)
    address = models.TextField()
    percentage_split = models.FloatField()
    field = models.CharField(max_length=255)
    color = models.CharField(max_length=7, default='#7499e1')
    locations = models.ManyToManyField(Location, through='ClinicianLocation')
    specialities = models.ManyToManyField(Speciality, through='ClinicianSpeciality')
    groups = models.ManyToManyField(Group, through='ClinicianGroup')
    modalities = models.ManyToManyField(Modality, through='ClinicianModality')

    def __str__(self):
        return f"Clinician {self.id}"

    class Meta:
        db_table = 'Clinician'
        indexes = [
            models.Index(fields=['login_id']),
        ]

class ClinicianLocation(models.Model):
    clinician = models.ForeignKey(Clinician, on_delete=models.CASCADE)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('clinician', 'location')
        db_table = 'Clinician_location'

class ClinicianSpeciality(models.Model):
    clinician = models.ForeignKey(Clinician, on_delete=models.CASCADE)
    speciality = models.ForeignKey(Speciality, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('clinician', 'speciality')
        db_table = 'Clinician_specialities'

class ClinicianGroup(models.Model):
    clinician = models.ForeignKey(Clinician, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('clinician', 'group')
        db_table = 'Clinician_groups'

class ClinicianModality(models.Model):
    clinician = models.ForeignKey(Clinician, on_delete=models.CASCADE)
    modality = models.ForeignKey(Modality, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('clinician', 'modality')
        db_table = 'Clinician_modalities'

class EventType(models.Model):
    """Model to store event types"""
    APPOINTMENT = 'APPOINTMENT'
    EVENT = 'EVENT'
    OUT_OF_OFFICE = 'OUT_OF_OFFICE'
    
    TYPE_CHOICES = [
        (APPOINTMENT, 'Appointment'),
        (EVENT, 'Event'),
        (OUT_OF_OFFICE, 'Out of Office')
    ]
    
    name = models.CharField(max_length=20, choices=TYPE_CHOICES, unique=True)
    
    class Meta:
        db_table = 'EventType'

    def __str__(self):
        return self.name

class AppointmentState(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'appointment_state'

class Event(models.Model):
    # Common fields
    type = models.ForeignKey(EventType, on_delete=models.PROTECT)
    title = models.CharField(max_length=255, null=True, blank=True) 
    clinician = models.ForeignKey(Clinician, on_delete=models.CASCADE)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    location = models.ForeignKey(Location, on_delete=models.CASCADE, null=True, blank=True)
    is_all_day = models.BooleanField(default=False)
    
    # Appointment specific fields
    patient = models.ForeignKey('Patient', on_delete=models.CASCADE, null=True, blank=True)
    status = models.ForeignKey(AppointmentState, on_delete=models.CASCADE, null=True, blank=True)
    
    # Out of office specific fields
    cancel_appointments = models.BooleanField(default=False)
    notify_clients = models.BooleanField(default=False)
    
    # Common optional fields
    notes = models.TextField(null=True, blank=True)
    
    # Recurrence fields
    is_recurring = models.BooleanField(default=False)
    recurrence_rule = models.CharField(max_length=255, null=True, blank=True)
    parent_event = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    occurrence_date = models.DateField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.type.name == EventType.EVENT:
            return self.title or 'Untitled Event'
        elif self.type.name == EventType.OUT_OF_OFFICE:
            return f'Out of Office - {self.clinician}'
        return f'Appointment - {self.patient}' if self.patient else 'Untitled Appointment'

    def clean(self):
        """Validate event data based on type"""
        if self.type.name == EventType.APPOINTMENT:
            if not self.patient:
                raise ValidationError('Patient is required for appointments')
            if not self.location:
                raise ValidationError('Location is required for appointments')
            if not self.status:
                raise ValidationError('Status is required for appointments')
        
        elif self.type.name == EventType.EVENT:
            if not self.title:
                raise ValidationError('Title is required for events')
        
        elif self.type.name == EventType.OUT_OF_OFFICE:
            if self.location:
                raise ValidationError('Location should not be set for out of office events')
            if self.patient:
                raise ValidationError('Patient should not be set for out of office events')
        if self.end_datetime <= self.start_datetime:
            raise ValidationError('End time must be after start time')

    class Meta:
        db_table = 'Event'
        indexes = [
            models.Index(fields=['start_datetime', 'end_datetime']),
            models.Index(fields=['clinician']),
            models.Index(fields=['type']),
            models.Index(fields=['parent_event']),
            models.Index(fields=['is_recurring']),
        ]

class Patient(models.Model):
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    login_id = models.CharField(max_length=255, unique=True)
    clinician = models.ForeignKey('Clinician', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        db_table = 'Patient'
        indexes = [
            models.Index(fields=['login_id']),
            models.Index(fields=['clinician']),
        ]