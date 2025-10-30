from rest_framework import serializers
from .models import *
class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['id', 'value', 'comment', 'created_at']

class EventSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    average_rating = serializers.ReadOnlyField()
    ratings = RatingSerializer(many=True, read_only=True)
    participants_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'

    def get_participants_count(self, obj):
        return obj.participants.count()

    def validate(self, data):
        if data.get('start_date') and data.get('end_date') and data['start_date'] >= data['end_date']:
            raise serializers.ValidationError("La date de fin doit être après la date de début.")
        if data.get('capacity', 0) <= 0:
            raise serializers.ValidationError("La capacité doit être supérieure à 0.")
        if data.get('price', 0) < 0:
            raise serializers.ValidationError("Le prix ne peut pas être négatif.")
        return data

class WorkshopSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    participants_count = serializers.SerializerMethodField()

    class Meta:
        model = Workshop
        fields = '__all__'

    def get_participants_count(self, obj):
        return obj.participants.count()

    def validate(self, data):
        if data.get('start_date') and data.get('end_date') and data['start_date'] >= data['end_date']:
            raise serializers.ValidationError("La date de fin doit être après la date de début.")
        if data.get('capacity', 0) <= 0:
            raise serializers.ValidationError("La capacité doit être supérieure à 0.")
        if data.get('price', 0) < 0:
            raise serializers.ValidationError("Le prix ne peut pas être négatif.")
        if data.get('level') and data['level'] not in ['beginner', 'intermediate', 'advanced']:
            raise serializers.ValidationError("Le niveau doit être débutant, intermédiaire ou avancé.")
        return data

class ArtworkSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)

    class Meta:
        model = Artwork
        fields = '__all__'

class ReservationSerializer(serializers.ModelSerializer):
    artwork = ArtworkSerializer(read_only=True)

    class Meta:
        model = Reservation
        fields = '__all__'

class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = ['artwork', 'full_name', 'email', 'phone', 'address', 'quantity', 'notes']

class EventParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventParticipant
        fields = '__all__'

    def validate(self, data):
        # Vérifier que l'événement existe
        if not data.get('event'):
            raise serializers.ValidationError("L'événement est obligatoire.")

        # Vérifier que l'email n'est pas déjà inscrit à cet événement
        if EventParticipant.objects.filter(event=data['event'], email=data.get('email')).exists():
            raise serializers.ValidationError("Cet email est déjà inscrit à cet événement.")

        # Vérifier que l'événement n'est pas complet
        event = data['event']
        if event.participants.count() >= event.capacity:
            raise serializers.ValidationError("Cet événement est complet.")

        return data

class WorkshopParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkshopParticipant
        fields = '__all__'

    def validate(self, data):
        # Vérifier que l'atelier existe
        if not data.get('workshop'):
            raise serializers.ValidationError("L'atelier est obligatoire.")

        # Vérifier que l'email n'est pas déjà inscrit à cet atelier
        if WorkshopParticipant.objects.filter(workshop=data['workshop'], email=data.get('email')).exists():
            raise serializers.ValidationError("Cet email est déjà inscrit à cet atelier.")

        # Vérifier que l'atelier n'est pas complet
        workshop = data['workshop']
        if workshop.participants.count() >= workshop.capacity:
            raise serializers.ValidationError("Cet atelier est complet.")

        return data

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(help_text="User's email (login)", required=True)
    first_name = serializers.CharField(help_text="User's first name", required=True)
    last_name = serializers.CharField(help_text="User's last name", required=True)

    password = serializers.CharField(write_only=True, help_text="User password", required=True, min_length=6)

    phone = serializers.CharField(required=False, allow_blank=True, help_text="Phone number (optional)")

    category = serializers.ChoiceField(choices=[('Visiteur', 'Visiteur'), ('Artist', 'Artist')], default='Visiteur', help_text="User category")

    artistic_nickname = serializers.CharField(required=False, allow_blank=True, help_text="Artistic nickname generated by AI")

    class Meta:
        model = User
        fields = [
            'email',
            'password',
            'first_name',
            'last_name',
            'category',
            'phone',
            'artistic_nickname',
        ]
  
   
    def validate(self, data):
        email = data.get('email')
        if email:
            email = email.lower()
            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError("Email already exists.")

            data['email'] = email
        request = self.context.get('request')
        user = request.user if request else None

        # No privileged built-in admin role creation via API; roles are Visiteur/Artist only
        return data

      
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        # Keep Django staff/superuser false; role is handled by category (Visiteur/Artist)
        user.is_staff = False
        user.is_superuser = False
              
        user.set_password(password)
        user.save()
        return user      
class UserReadSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'category',
            'phone',
            'profile_picture',
            'artistic_nickname',
        ]

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=8, help_text="8-digit password reset token")
    new_password = serializers.CharField(write_only=True, help_text="New password", min_length=8)

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters.")
        return value

    def validate_token(self, value):
        if not PasswordResetToken.objects.filter(token=value).exists():
            raise serializers.ValidationError("Invalid or expired token.")
        return value 
class PasswordResetRequestSerializer(serializers.Serializer):

    email = serializers.EmailField(help_text="User's email to send reset token")

class CommentSerializer(serializers.ModelSerializer):
    user = UserReadSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'artwork', 'user', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'artwork', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)