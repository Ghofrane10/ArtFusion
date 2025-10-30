from django.db import models
import os
import json
from groq import Groq

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
    quantity_initial = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    image = models.ImageField(upload_to='artworks/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.pk:
            self.quantity_initial = self.quantity_available
        super().save(*args, **kwargs)

    def update_available_quantity(self):
        active_reservations = self.reservations.exclude(status='cancelled')
        total_reserved = sum(r.quantity for r in active_reservations)
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


class Rating(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='ratings')
    value = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['event', 'created_at']

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
    duration = models.DurationField()
    materials_provided = models.TextField(blank=True)
    instructor = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Comment(models.Model):
    SENTIMENT_CHOICES = [
        ('satisfied', 'Satisfait'),
        ('not_satisfied', 'Non satisfait'),
        ('neutral', 'Neutre'),
    ]

    MODERATION_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
        ('flagged', 'Marqué pour révision'),
    ]

    content = models.TextField()
    artwork = models.ForeignKey(Artwork, on_delete=models.CASCADE, related_name='comments')
    sentiment = models.CharField(max_length=20, choices=SENTIMENT_CHOICES, default='neutral')
    created_at = models.DateTimeField(auto_now_add=True)
    moderation_status = models.CharField(max_length=20, choices=MODERATION_CHOICES, default='pending')
    moderation_reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Comment on {self.artwork.title} - {self.sentiment}"

    def moderate_content(self):
        """Modération automatique via Groq uniquement"""
        try:
            client = Groq(api_key=os.getenv('GROQ_API_KEY'))

            prompt = f"""
            Analyse le commentaire suivant et retourne uniquement un JSON avec :
            - status: "approved" ou "rejected"
            - reason: courte explication si rejeté
            - sentiment: "positive", "negative", ou "neutral"
            - categories: liste (insulte, haine, spam, etc.)

            Commentaire : "{self.content}"
            """

            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "Tu es un modérateur. Retourne seulement un JSON valide."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=200,
            )

            raw_output = response.choices[0].message.content.strip()

            if raw_output.startswith("```"):
                raw_output = raw_output.strip("`").replace("json", "").strip()

            result = json.loads(raw_output)

            self.moderation_status = result.get("status", "pending")
            self.moderation_reason = result.get("reason", "")
            sentiment = result.get("sentiment", "neutral")

            if sentiment == "positive":
                self.sentiment = "satisfied"
            elif sentiment == "negative":
                self.sentiment = "not_satisfied"
            else:
                self.sentiment = "neutral"

            self.save()

        except Exception as e:
            print(f"Erreur Groq API: {e}")
            self.moderation_status = "error"
            self.moderation_reason = str(e)
            self.save()
