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

class WorkshopSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    participants_count = serializers.SerializerMethodField()

    class Meta:
        model = Workshop
        fields = '__all__'

    def get_participants_count(self, obj):
        return obj.participants.count()

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

class WorkshopParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkshopParticipant
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(help_text="User's email (login)", required=True)
    first_name = serializers.CharField(help_text="User's first name", required=True)
    last_name = serializers.CharField(help_text="User's last name", required=True)
  
    password = serializers.CharField(write_only=True, help_text="User password", required=True, min_length=6)
    
    phone = serializers.CharField(required=False, allow_blank=True, help_text="Phone number (optional)")
    
    category = serializers.ChoiceField(choices=[('Visiteur', 'Visiteur'), ('Admin', 'Admin')], default='Visiteur', help_text="User category")
    
    class Meta:
        model = User
        fields = [
            'email',
            'password',
            'first_name',
            'last_name',
            'category',
            'phone',
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

        if data.get('category') == 'Admin':
            if not user or not user.is_authenticated:
                self._raise_error("You must be authenticated to create an Admin.")
            if user.category != 'Admin':
                self._raise_error("Only Admins are allowed to create other Admin users.")
        return data

      
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        if validated_data.get('category') == 'Admin':
           user.is_staff = True
           user.is_superuser = True
    
        else:

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