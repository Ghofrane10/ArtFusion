from rest_framework import serializers
from .models import Event, Workshop, Rating, Artwork, Reservation, Comment

class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['id', 'value', 'comment', 'created_at']

class EventSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    average_rating = serializers.ReadOnlyField()
    ratings = RatingSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = '__all__'

class WorkshopSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)

    class Meta:
        model = Workshop
        fields = '__all__'

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

class CommentSerializer(serializers.ModelSerializer):
    artwork = ArtworkSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = '__all__'

class CommentModerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['moderation_status', 'moderation_reason']

class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['content', 'artwork', 'sentiment']