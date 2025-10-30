from django.db import models

# Create your models here.

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

class Comment(models.Model):
    SENTIMENT_CHOICES = [
        ('satisfied', 'Satisfait'),
        ('not_satisfied', 'Non satisfait'),
        ('neutral', 'Neutre'),
    ]

    MODERATION_CHOICES = [
        ('pending', 'En attente de modération'),
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
        """Modère automatiquement le contenu du commentaire en utilisant Groq API"""
        import os
        from groq import Groq

        try:
            # Initialiser le client Groq
            client = Groq(api_key=os.getenv('GROQ_API_KEY'))

            # Prompt pour la modération
            prompt = f"""
            Analysez le commentaire suivant et déterminez s'il est approprié ou non.
            Retournez uniquement un JSON avec les champs suivants :
            - status: "approved" ou "rejected"
            - reason: explication brève si rejeté
            - sentiment: "positive", "negative", ou "neutral"
            - categories: liste des catégories problématiques si applicable (insulte, haine, spam, etc.)

            Commentaire: "{self.content}"
            """

            # Appel à l'API Groq
            response = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {"role": "system", "content": "Vous êtes un modérateur de contenu. Analysez les commentaires et retournez uniquement du JSON valide."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=200
            )

            # Parser la réponse JSON
            import json
            result = json.loads(response.choices[0].message.content.strip())

            self.moderation_status = result.get('status', 'pending')
            self.moderation_reason = result.get('reason', '')

            # Déterminer le sentiment basé sur la réponse
            sentiment = result.get('sentiment', 'neutral')
            if sentiment == 'positive':
                self.sentiment = 'satisfied'
            elif sentiment == 'negative':
                self.sentiment = 'not_satisfied'
            else:
                self.sentiment = 'neutral'

        except Exception as e:
            # Fallback vers la modération par mots-clés en cas d'erreur
            print(f"Erreur Groq API: {e}")
            self._fallback_moderation()

        self.save()

    def _fallback_moderation(self):
        """Modération de secours par mots-clés"""
        inappropriate_words = [
            'nul', 'nulle', 'merde', 'idiot', 'stupide', 'horrible', 'dégoût',
            'suce', 'enculé', 'connard', 'salope', 'pute', 'bordel', 
             'shit', 'asshole', 'bitch', 'damn', 'hell', 'crap'
        ]

        content_lower = self.content.lower()

        found_inappropriate = []
        for word in inappropriate_words:
            if word in content_lower:
                found_inappropriate.append(word)

        if found_inappropriate:
            self.moderation_status = 'rejected'
            self.moderation_reason = f"Contenu inapproprié détecté: {', '.join(found_inappropriate)}"
        else:
            self.moderation_status = 'approved'
