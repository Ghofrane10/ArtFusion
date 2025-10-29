from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Event, Workshop, Rating, Artwork, Reservation
from .serializers import EventSerializer, WorkshopSerializer, RatingSerializer, ArtworkSerializer, ReservationSerializer, ReservationCreateSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status ,generics
from rest_framework.permissions import IsAuthenticated , AllowAny , IsAdminUser
from django.db import transaction
from rest_framework.parsers import MultiPartParser, FormParser
from io import BytesIO
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from django.contrib.auth import authenticate
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
# from ..tasks import *
# from ..models import User, OTP, PasswordResetToken
from .serializers import *
import random
from datetime import timedelta
# from rest_framework_simplejwt.tokens import RefreshToken, TokenError
import os
@api_view(['GET', 'POST'])
def event_list_create(request):
    if request.method == 'GET':
        events = Event.objects.all()
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def event_detail(request, pk):
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = EventSerializer(event)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = EventSerializer(event, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
def workshop_list_create(request):
    if request.method == 'GET':
        workshops = Workshop.objects.all()
        serializer = WorkshopSerializer(workshops, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = WorkshopSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def workshop_detail(request, pk):
    try:
        workshop = Workshop.objects.get(pk=pk)
    except Workshop.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = WorkshopSerializer(workshop)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = WorkshopSerializer(workshop, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        workshop.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
def event_ratings(request, event_id):
    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        ratings = Rating.objects.filter(event=event)
        serializer = RatingSerializer(ratings, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = RatingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(event=event)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def artwork_list_create(request):
    if request.method == 'GET':
        artworks = Artwork.objects.all()
        serializer = ArtworkSerializer(artworks, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ArtworkSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def artwork_detail(request, pk):
    try:
        artwork = Artwork.objects.get(pk=pk)
    except Artwork.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ArtworkSerializer(artwork)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ArtworkSerializer(artwork, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        artwork.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
def reservation_list_create(request):
    if request.method == 'GET':
        reservations = Reservation.objects.all()
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ReservationCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Vérifier la disponibilité de l'œuvre
            artwork = serializer.validated_data['artwork']
            quantity_requested = serializer.validated_data['quantity']

            if artwork.quantity_available < quantity_requested:
                return Response(
                    {'error': 'Quantité insuffisante disponible'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Créer la réservation (elle sera en pending par défaut)
            reservation = serializer.save()

            # Retourner la réservation
            response_serializer = ReservationSerializer(reservation)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PATCH', 'DELETE'])
def reservation_detail(request, pk):
    try:
        reservation = Reservation.objects.get(pk=pk)
    except Reservation.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = ReservationSerializer(reservation, data=request.data, partial=True)
        if serializer.is_valid():
            new_reservation = serializer.save()

            # Recalculer la quantité disponible de l'œuvre après tout changement de statut
            new_reservation.artwork.update_available_quantity()

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Supprimer la réservation
        artwork = reservation.artwork
        reservation.delete()

        # Recalculer la quantité disponible de l'œuvre
        artwork.update_available_quantity()

        return Response(status=status.HTTP_204_NO_CONTENT)


class UserCreateView(APIView):
    permission_classes = [AllowAny]

   
    def post(self, request):
        serializer = UserSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            
            # Essayer d'envoyer l'email, mais ne pas bloquer l'inscription si ça échoue
            try:
                send_mail(
                    subject='Welcome to ArtFusion',
                    message=f"Hello {user.first_name},\nWelcome to ArtFusion! ",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                # Logger l'erreur mais ne pas empêcher l'inscription
                print(f"Erreur lors de l'envoi de l'email: {e}")

            return Response(
                {'detail': 'User created successfully!'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)        
class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password :
            return Response(
                {"detail": "Email and  password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        user = authenticate(request, email=email.lower(), password=password)
        if user is None:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        user_data = UserReadSerializer(user).data

        return Response(
                    {
                        "detail": "Login successful.",
                        "token": {
                "access": access_token,
                "refresh": str(refresh),
            },
                        "user": user_data,
                    },
                    status=status.HTTP_200_OK
                )
       
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
  
   
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({'detail': 'If this email exists, a password reset token has been sent.'})

            token = PasswordResetToken.objects.create(
                user=user,
                valid_until=timezone.now() + timedelta(hours=1)
            )

            # Afficher le token dans la console pour le développement
            print(f"\n{'='*60}")
            print(f"PASSWORD RESET TOKEN FOR {user.email}")
            print(f"Token: {token.token}")
            print(f"Valid until: {token.valid_until}")
            print(f"{'='*60}\n")

            # Essayer d'envoyer l'email
            try:
                send_mail(
                    subject='Password Reset Token - ArtFusion',
                    message=(
                        f"Hello {user.first_name},\n\n"
                        f"You have requested to reset your password.\n\n"
                        f"Here is your password reset token: {token.token}\n"
                        f"This token will expire in 1 hour.\n\n"
                        f"Use this token on the password reset page to set your new password.\n\n"
                        f"If you did not request this password reset, please ignore this email.\n\n"
                        f"Best regards,\n"
                        f"ArtFusion Team"
                    ),
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Erreur lors de l'envoi de l'email: {e}")

            return Response({'detail': 'If this email exists, a password reset token has been sent.'})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

   
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token_val = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']

            try:
                token = PasswordResetToken.objects.get(token=token_val)
            except PasswordResetToken.DoesNotExist:
                return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)

            if not token.is_valid():
                return Response({'detail': 'Token expired.'}, status=status.HTTP_400_BAD_REQUEST)

            user = token.user
            user.set_password(new_password)
            user.save()
            token.delete()

            return Response({'detail': 'Password reset successful.'})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileUpdateView(generics.UpdateAPIView):
    serializer_class = UserReadSerializer
    permission_classes = [IsAuthenticated]

  
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    def get_object(self):
        return self.request.user

class GetMyselfAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request):
        user = request.user
        serializer = UserReadSerializer(user, context={'request': request})
        return Response(serializer.data)
    
    def patch(self, request):
        user = request.user
        serializer = UserReadSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)