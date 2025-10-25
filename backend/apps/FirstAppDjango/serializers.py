from rest_framework import serializers
from .models import Event, Workshop, Rating

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