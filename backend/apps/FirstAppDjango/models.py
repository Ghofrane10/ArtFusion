from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import random

from django.contrib.auth.base_user import BaseUserManager
class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email must be set")
        email = self.normalize_email(email)
        first_name = extra_fields.get('first_name')
        if not first_name:
            raise ValueError("The first_name field must be set")

        last_name = extra_fields.get('last_name')
        if not last_name:
            raise ValueError("The last_name field must be set")

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        # For superuser, we'll allow any category but set admin privileges
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')

        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
      
        return self.create_user(email, password, **extra_fields)
# Create your models here.
class User(AbstractUser):
    username = None 
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    ROLE_CHOICES = [
        ('Visiteur', 'Visiteur'),
        ('Artist', 'Artist'),
    ]
    category = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Visiteur')
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    phone = models.CharField(max_length=20, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    
    email_active = models.BooleanField(default=False)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'category']
    objects = UserManager()
    def save(self, *args, **kwargs):
            valid_roles = [choice[0] for choice in self.ROLE_CHOICES]
            if self.email:
                   self.email = self.email.lower()
                   
            if self.category not in valid_roles:
                raise ValueError(f"Category must be one of {valid_roles}")

           
            super().save(*args, **kwargs)
    def _str_(self):
        return f"{self.first_name} {self.last_name} ({self.category})"

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=8, unique=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateTimeField()

    def is_valid(self):
        return timezone.now() < self.valid_until

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = self._generate_unique_token()
        super().save(*args, **kwargs)

    def _generate_unique_token(self):
        while True:
            token = f"{random.randint(10000000, 99999999)}"  
            if not PasswordResetToken.objects.filter(token=token).exists():
                return token   



class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location = models.CharField(max_length=200)
    image = models.ImageField(upload_to='events/', blank=True, null=True)
    capacity = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Artwork(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    quantity_available = models.PositiveIntegerField(default=1)
    quantity_initial = models.PositiveIntegerField(default=1)  # Quantité initiale sauvegardée
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    image = models.ImageField(upload_to='artworks/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Sauvegarder la quantité initiale lors de la première création
        if not self.pk:
            self.quantity_initial = self.quantity_available
        super().save(*args, **kwargs)

    def update_available_quantity(self):
        """Recalcule la quantité disponible basée sur toutes les réservations (sauf cancelled)"""
        active_reservations = self.reservations.exclude(status='cancelled')
        total_reserved = sum(reservation.quantity for reservation in active_reservations)
        self.quantity_available = self.quantity_initial - total_reserved
        self.save()

class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('delivered', 'Livrée'),
        ('cancelled', 'Annulée'),
    ]

    artwork = models.ForeignKey(Artwork, on_delete=models.CASCADE, related_name='reservations')
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Réservation de {self.artwork.title} par {self.full_name}"

    class Meta:
        ordering = ['-created_at']

    @property
    def average_rating(self):
        ratings = self.ratings.all()
        if ratings:
            return sum(rating.value for rating in ratings) / len(ratings)
        return 0

class Rating(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='ratings')
    value = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 étoiles
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['event', 'created_at']  # Un rating par événement par session (simplifié)

    def __str__(self):
        return f"Rating {self.value} for {self.event.title}"

class Workshop(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location = models.CharField(max_length=200)
    image = models.ImageField(upload_to='workshops/', blank=True, null=True)
    capacity = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    level = models.CharField(max_length=50, choices=[
        ('beginner', 'Débutant'),
        ('intermediate', 'Intermédiaire'),
        ('advanced', 'Avancé')
    ])
    duration = models.DurationField()  # e.g., timedelta
    materials_provided = models.TextField(blank=True)
    instructor = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
