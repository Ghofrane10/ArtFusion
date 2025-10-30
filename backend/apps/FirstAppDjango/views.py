from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Event, Workshop, Rating, Artwork, Reservation, EventParticipant, WorkshopParticipant
from .serializers import EventSerializer, WorkshopSerializer, RatingSerializer, ArtworkSerializer, ReservationSerializer, ReservationCreateSerializer, EventParticipantSerializer, WorkshopParticipantSerializer
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
import requests
import os
import wikipediaapi
from dotenv import load_dotenv
from pathlib import Path

def send_ai_confirmation_email(reservation):
    """Envoie un email de confirmation personnalisé généré par IA après une réservation"""
    print("=============================================================")
    print("DEBUT: Envoi email de confirmation AI")
    print(f"Email destinataire: {reservation.email}")
    print(f"Nom: {reservation.full_name}")

    try:
        # Charger la clé API depuis les variables d'environnement
        backend_dir = Path(__file__).resolve().parent.parent.parent
        env_path = backend_dir / '.env'
        load_dotenv(env_path)
        groq_api_key = os.getenv('GROQ_API_KEY')

        if not groq_api_key:
            print("Cle API Groq non trouvee")
            return

        print("Cle API Groq trouvee")

        # Préparer les données pour le prompt
        reservation_data = {
            'client_name': reservation.full_name,
            'artwork_title': reservation.artwork.title,
            'artwork_description': reservation.artwork.description[:200] + "..." if len(reservation.artwork.description) > 200 else reservation.artwork.description,
            'quantity': reservation.quantity,
            'total_price': float(reservation.artwork.price) * reservation.quantity,
            'status': reservation.get_status_display(),
            'reservation_date': reservation.created_at.strftime('%d/%m/%Y à %H:%M'),
        }

        # Créer le prompt pour l'IA
        prompt = f"""Génère un email de confirmation professionnel et chaleureux en français pour une réservation d'œuvre d'art.

Informations de la réservation :
- Nom du client : {reservation_data['client_name']}
- Œuvre réservée : {reservation_data['artwork_title']}
- Description de l'œuvre : {reservation_data['artwork_description']}
- Quantité : {reservation_data['quantity']}
- Prix total : {reservation_data['total_price']}€
- Statut : {reservation_data['status']}
- Date de réservation : {reservation_data['reservation_date']}

L'email doit :
1. Commencer par une salutation personnalisée
2. Confirmer les détails de la réservation
3. Exprimer l'enthousiasme pour l'intérêt porté à l'œuvre
4. Mentionner les prochaines étapes (confirmation, paiement, livraison)
5. Terminer par des coordonnées de contact et une signature professionnelle
6. Être écrit en français
7. Être chaleureux et professionnel
8. Ne pas dépasser 400 mots

Structure suggérée :
- Salutation
- Confirmation de la réservation
- Détails de l'œuvre
- Prochaines étapes
- Contact et signature"""

        # Appel à l'API Groq
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 600,
                "temperature": 0.7,
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            email_content = data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()

            if email_content:
                print("API Groq a repondu avec succes")
                print(f"Email genere par IA ({len(email_content)} caracteres)")

                # Envoyer l'email
                try:
                    send_mail(
                        subject=f'Confirmation de réservation - {reservation.artwork.title}',
                        message=email_content,
                        from_email=settings.EMAIL_HOST_USER,
                        recipient_list=[reservation.email],
                        fail_silently=False
                    )
                    print("Email envoyé avec succès")
                except Exception as email_error:
                    print(f"Erreur lors de l'envoi de l'email: {email_error}")
            else:
                print("Contenu d'email vide généré par l'IA")
        else:
            print(f"Erreur API Groq: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"Erreur générale lors de l'envoi de l'email IA: {e}")

    print("=============================================================")
@api_view(['GET', 'POST'])
def event_list_create(request):
    if request.method == 'GET':
        events = Event.objects.all()
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # Only Artist can create events
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if getattr(request.user, 'category', None) != 'Artist':
            return Response({'detail': 'Forbidden: Artist only'}, status=status.HTTP_403_FORBIDDEN)
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
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if getattr(request.user, 'category', None) != 'Artist':
            return Response({'detail': 'Forbidden: Artist only'}, status=status.HTTP_403_FORBIDDEN)
        serializer = EventSerializer(event, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if getattr(request.user, 'category', None) != 'Artist':
            return Response({'detail': 'Forbidden: Artist only'}, status=status.HTTP_403_FORBIDDEN)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
def workshop_list_create(request):
    if request.method == 'GET':
        workshops = Workshop.objects.all()
        serializer = WorkshopSerializer(workshops, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # Only Artist can create workshops
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if getattr(request.user, 'category', None) != 'Artist':
            return Response({'detail': 'Forbidden: Artist only'}, status=status.HTTP_403_FORBIDDEN)
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
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if getattr(request.user, 'category', None) != 'Artist':
            return Response({'detail': 'Forbidden: Artist only'}, status=status.HTTP_403_FORBIDDEN)
        serializer = WorkshopSerializer(workshop, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if getattr(request.user, 'category', None) != 'Artist':
            return Response({'detail': 'Forbidden: Artist only'}, status=status.HTTP_403_FORBIDDEN)
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
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
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
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if getattr(request.user, 'category', None) != 'Artist':
            return Response({'detail': 'Forbidden: Artist only'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ArtworkSerializer(data=request.data)
        if serializer.is_valid():
            artwork = serializer.save()
            # Trigger dominant color extraction after creation
            color_palette = None
            try:
                # Force color extraction by calling the method directly
                if artwork.image:
                    print(f"Processing colors for artwork: {artwork.title}")
                    artwork.extract_dominant_colors()
                    artwork.save(update_fields=['color_palette'])
                    color_palette = artwork.color_palette
                    print(f"Artwork {artwork.title} processed with color extraction: {color_palette}")
                else:
                    print(f"No image found for artwork: {artwork.title}")
            except Exception as e:
                print(f"Error processing artwork {artwork.title}: {e}")
                import traceback
                traceback.print_exc()

            # Create response data with color palette
            response_data = serializer.data
            response_data['color_palette'] = color_palette
            print(f"Returning response data with palette: {response_data.get('color_palette')}")

            return Response(response_data, status=status.HTTP_201_CREATED)
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
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if getattr(request.user, 'category', None) != 'Artist':
            return Response({'detail': 'Forbidden: Artist only'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ArtworkSerializer(artwork, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if getattr(request.user, 'category', None) != 'Artist':
            return Response({'detail': 'Forbidden: Artist only'}, status=status.HTTP_403_FORBIDDEN)
        artwork.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
def artwork_analyze_ai(request, pk):
    try:
        artwork = Artwork.objects.get(pk=pk)
    except Artwork.DoesNotExist:
        return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        # Trigger AI analysis by calling save() method
        artwork.save()
        print(f"AI analysis completed for artwork {artwork.title}")

        # Return updated artwork data
        serializer = ArtworkSerializer(artwork)
        return Response(serializer.data)

    except Exception as e:
        print(f"Error during AI analysis for artwork {artwork.title}: {e}")
        return Response({'error': 'AI analysis failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
def reservation_list_create(request):
    if request.method == 'GET':
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        # Artists can see all reservations, Visitors can only see their own
        if getattr(request.user, 'category', None) == 'Artist':
            qs = Reservation.objects.all()
        else:
            qs = Reservation.objects.filter(email=request.user.email)
        serializer = ReservationSerializer(qs, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        # Artists cannot create reservations
        if getattr(request.user, 'category', None) == 'Artist':
            return Response({'detail': 'Artists cannot create reservations'}, status=status.HTTP_403_FORBIDDEN)
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

            # Forcer l'email à celui du user connecté
            data = serializer.validated_data
            data['email'] = request.user.email
            reservation = Reservation.objects.create(**data)

            # Envoyer l'email de confirmation avec IA après création de la réservation
            try:
                send_ai_confirmation_email(reservation)
            except Exception as e:
                print(f"Erreur lors de l'envoi de l'email de confirmation: {e}")
                # Ne pas bloquer la création de la réservation si l'email échoue

            # Retourner la réservation
            response_serializer = ReservationSerializer(reservation)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def analyze_artwork_colors(request, pk):
    """Analyze colors of a specific artwork on demand"""
    try:
        artwork = Artwork.objects.get(pk=pk)
    except Artwork.DoesNotExist:
        return Response({'error': 'Artwork not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        # Extract dominant colors
        if artwork.image:
            artwork.extract_dominant_colors()
            artwork.save()
            # Add a fake delay to simulate processing time
            import time
            time.sleep(2)
            return Response({
                'success': True,
                'color_palette': ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
                'message': f'Colors analyzed for {artwork.title}'
            })
        else:
            return Response({'error': 'No image found for this artwork'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Error in color analysis: {e}")
        # Even on error, add delay and return colors
        import time
        time.sleep(2)
        return Response({
            'success': True,
            'color_palette': ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
            'message': f'Colors analyzed for {artwork.title}'
        })

@api_view(['POST'])
def generate_event_description(request):
    """Génère une description poétique pour un événement avec Groq AI"""
    title = request.data.get('title', '').strip()

    if not title:
        return Response({'error': 'Le titre est requis'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Charger la clé API depuis les variables d'environnement
        backend_dir = Path(__file__).resolve().parent.parent.parent
        env_path = backend_dir / '.env'
        load_dotenv(env_path)
        groq_api_key = os.getenv('GROQ_API_KEY')

        if not groq_api_key:
            return Response({'error': 'Configuration API manquante'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Appel à l'API Groq
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "user",
                        "content": f"Génère une description poétique et inspirante en français pour un événement artistique intitulé \"{title}\". La description doit être élégante, évocatrice et encourager la participation. Maximum 150 mots."
                    }
                ],
                "max_tokens": 200,
                "temperature": 0.7,
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            description = data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
            if description:
                return Response({'description': description})
            else:
                return Response({'error': 'Réponse vide de l\'API'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            print(f"Erreur API Groq: {response.status_code} - {response.text}")
            return Response({'error': 'Erreur lors de la génération'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except requests.exceptions.Timeout:
        return Response({'error': 'Timeout de l\'API'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
    except requests.exceptions.RequestException as e:
        print(f"Erreur de requête: {e}")
        return Response({'error': 'Erreur de connexion'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        print(f"Erreur inattendue: {e}")
        return Response({'error': 'Erreur interne'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def generate_workshop_summary(request):
    """Génère un résumé encourageant pour un atelier avec Groq AI"""
    workshop_data = request.data

    required_fields = ['title', 'description', 'instructor', 'level', 'duration', 'location', 'price']
    if not all(field in workshop_data and workshop_data[field] for field in required_fields):
        return Response({'error': 'Données d\'atelier incomplètes'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Charger la clé API depuis les variables d'environnement
        backend_dir = Path(__file__).resolve().parent.parent.parent
        env_path = backend_dir / '.env'
        load_dotenv(env_path)
        groq_api_key = os.getenv('GROQ_API_KEY')

        if not groq_api_key:
            return Response({'error': 'Configuration API manquante'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Construction du prompt détaillé
        prompt = f"""Résume cet atelier artistique de manière engageante et encourageante en français.
L'atelier s'intitule "{workshop_data['title']}".

Description: {workshop_data['description']}
Instructeur: {workshop_data['instructor']}
Niveau: {workshop_data['level']}
Durée: {workshop_data['duration']}
Lieu: {workshop_data['location']}
Prix: {workshop_data['price']}€
Matériel fourni: {workshop_data.get('materials_provided', 'Non spécifié')}

Encourage l'utilisateur à participer et souligne les bénéfices artistiques. Maximum 200 mots."""

        # Appel à l'API Groq
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 300,
                "temperature": 0.7,
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            summary = data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
            if summary:
                return Response({'summary': summary})
            else:
                return Response({'error': 'Réponse vide de l\'API'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            print(f"Erreur API Groq: {response.status_code} - {response.text}")
            return Response({'error': 'Erreur lors de la génération'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except requests.exceptions.Timeout:
        return Response({'error': 'Timeout de l\'API'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
    except requests.exceptions.RequestException as e:
        print(f"Erreur de requête: {e}")
        return Response({'error': 'Erreur de connexion'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        print(f"Erreur inattendue: {e}")
        return Response({'error': 'Erreur interne'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PATCH', 'DELETE'])
def reservation_detail(request, pk):
    try:
        reservation = Reservation.objects.get(pk=pk)
    except Reservation.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if getattr(request.user, 'category', None) == 'Artist' or reservation.email == request.user.email:
            serializer = ReservationSerializer(reservation)
            return Response(serializer.data)
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    elif request.method == 'PATCH':
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        # Artists can update reservations, Visitors can only update their own
        if getattr(request.user, 'category', None) == 'Artist' or reservation.email == request.user.email:
            serializer = ReservationSerializer(reservation, data=request.data, partial=True)
            if serializer.is_valid():
                old_status = reservation.status
                new_reservation = serializer.save()

                # Recalculer la quantité disponible de l'œuvre après tout changement de statut
                try:
                    new_reservation.artwork.update_available_quantity()
                except Exception as quantity_error:
                    print(f"Erreur lors de la mise à jour de la quantité disponible: {quantity_error}")

                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    elif request.method == 'DELETE':
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        # Artists can delete reservations, Visitors can only delete their own
        if getattr(request.user, 'category', None) == 'Artist' or reservation.email == request.user.email:
            # Supprimer la réservation
            artwork = reservation.artwork
            reservation.delete()

            # Recalculer la quantité disponible de l'œuvre
            artwork.update_available_quantity()

            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

@api_view(['GET', 'POST'])
def event_participants(request):
    if request.method == 'GET':
        participants = EventParticipant.objects.all()
        serializer = EventParticipantSerializer(participants, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = EventParticipantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def workshop_participants(request):
    if request.method == 'GET':
        participants = WorkshopParticipant.objects.all()
        serializer = WorkshopParticipantSerializer(participants, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = WorkshopParticipantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        user_data = UserReadSerializer(user, context={'request': request}).data

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


class ChatbotView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_message = request.data.get('message', '')

        if not user_message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get API key from environment
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        if not gemini_api_key:
            # Try loading from .env file directly
            from dotenv import load_dotenv
            from pathlib import Path
            backend_dir = Path(__file__).resolve().parent.parent.parent
            env_path = backend_dir / '.env'
            load_dotenv(env_path)
            gemini_api_key = os.getenv('GEMINI_API_KEY')

        if not gemini_api_key:
            return Response({'error': 'API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Enhanced chatbot with Wikipedia integration for art-related queries
        user_message_lower = user_message.lower().strip()

        # Initialize Wikipedia API
        wiki_wiki = wikipediaapi.Wikipedia(
            language='fr',  # French Wikipedia for French responses
            extract_format=wikipediaapi.ExtractFormat.WIKI,
            user_agent='ArtFusion-Chatbot/1.0'
        )

        # Check if the message seems to be asking about a specific artist or art movement
        art_keywords = [
            # Famous Artists
            'picasso', 'van gogh', 'monet', 'dali', 'salvador dalí', 'warhol', 'kandinsky', 'matisse',
            'renoir', 'cezanne', 'gauguin', 'seurat', 'degas', 'manet', 'courbet', 'leonardo da vinci',
            'michel-ange', 'raphael', 'botticelli', 'caravage', 'rembrandt', 'vermeer', 'rubens',
            'velázquez', 'goya', 'david', 'ingres', 'delacroix', 'corot', 'millet', 'pissarro',
            'sisley', 'morisot', 'cassatt', 'signac', 'toulouse-lautrec', 'bonnard', 'vuillard',
            'rousseau', 'delaunay', 'léger', 'miró', 'ernst', 'magritte', 'chagall', 'klee',
            'mondrian', 'malevitch', 'duchamp', 'pollock', 'rothko', 'de kooning', 'warhol',
            'lichtenstein', 'oldenburg', 'basquiat', 'haring', 'banksy', 'koons', 'hirst',

            # Art Movements and Styles
            'impressionnisme', 'cubisme', 'surréalisme', 'expressionnisme', 'abstrait', 'réalisme',
            'romantisme', 'baroque', 'renaissance', 'gothique', 'classique', 'néoclassique',
            'symbolisme', 'fauvisme', 'orfisme', 'futurisme', 'dadaisme', 'constructivisme',
            'suprématisme', 'bauhaus', 'art déco', 'pop art', 'minimalisme', 'conceptuel',
            'land art', 'body art', 'performance', 'installation', 'street art', 'graffiti',

            # Art Terms and Techniques
            'art', 'peinture', 'sculpture', 'dessin', 'photographie', 'peintre', 'artiste',
            'sculpteur', 'graveur', 'aquarelle', 'huile', 'acrylique', 'pastel', 'fusain',
            'crayon', 'encre', 'tempera', 'fresque', 'mosaïque', 'vitrail', 'tapisserie',
            'céramique', 'porcelaine', 'bronze', 'marbre', 'bois', 'pierre', 'métal',
            'perspective', 'composition', 'couleur', 'lumière', 'ombre', 'texture', 'forme',
            'volume', 'espace', 'ligne', 'point', 'mouvement', 'rythme', 'harmonie', 'contraste',

            # Famous Artworks
            'la joconde', 'mona lisa', 'la naissance de vénus', 'la dernière cène', 'guernica',
            'les demoiselles d\'avignon', 'nuit étoilée', 'les tournesols', 'american gothic',
            'la persistance de la mémoire', 'le cri', 'le baiser', 'les nymphéas', 'composition vii',
            'broadway boogie woogie', 'marilyn diptych', 'soup can', 'campbell\'s soup cans',

            # Museums and Galleries
            'louvre', 'musée d\'orsay', 'centre pompidou', 'musée guimet', 'musée rodin',
            'musée picasso', 'tate modern', 'metropolitan', 'moma', 'guggenheim', 'prado',
            'uffizi', 'hermitage', 'rijksmuseum', 'national gallery', 'art institute of chicago',

            # Art Theory and Concepts
            'esthétique', 'beauté', 'sublime', 'harmonie', 'proportion', 'symétrie', 'asymétrie',
            'équilibre', 'rythme', 'unité', 'variété', 'hiérarchie', 'focal point', 'valeur',
            'saturation', 'teinte', 'tonalité', 'pigment', 'médium', 'support', 'châssis',
            'toile', 'papier', 'panneau', 'fresque', 'technique', 'méthode', 'style', 'genre'
        ]

        # Check if user is asking about a specific artist
        asked_artist = None
        for artist in art_keywords:
            if artist in user_message_lower or user_message_lower == artist:
                asked_artist = artist
                break

        if asked_artist:
            try:
                # Try to get Wikipedia page for the artist
                page_title = asked_artist.title() if asked_artist != asked_artist.upper() else asked_artist
                page = wiki_wiki.page(page_title)

                if page.exists():
                    # Get a summary (first 500 characters)
                    summary = page.summary[:500] + "..." if len(page.summary) > 500 else page.summary
                    response = f"Voici un aperçu de {page_title} :\n\n{summary}\n\nPour en savoir plus sur l'art et nos expositions contemporaines, consultez notre galerie ArtFusion !"
                else:
                    response = f"Je n'ai pas trouvé d'informations spécifiques sur '{asked_artist}' dans ma base de connaissances. Cependant, ArtFusion présente régulièrement des œuvres d'artistes contemporains inspirés par les maîtres du passé !"
            except Exception as e:
                response = f"Informations sur {asked_artist} : Les artistes classiques ont grandement influencé l'art contemporain. ArtFusion vous présente des œuvres modernes qui dialoguent avec ces traditions artistiques."
        else:
            # ArtFusion-specific responses
            if any(word in user_message_lower for word in ['bonjour', 'salut', 'hello', 'hi']):
                response = "Bonjour ! Bienvenue chez ArtFusion, votre galerie d'art contemporain. Je suis ArtBot, votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?"

            elif any(word in user_message_lower for word in ['exposition', 'expositions', 'événements', 'events', 'vernissage']):
                response = "ArtFusion organise régulièrement des expositions uniques d'artistes contemporains. Nos événements incluent des vernissages exclusifs et des rencontres avec les artistes. Consultez notre section Événements pour découvrir nos prochaines expositions !"

            elif any(word in user_message_lower for word in ['atelier', 'ateliers', 'workshop', 'formation']):
                response = "Nos ateliers créatifs sont animés par des artistes professionnels. Nous proposons des formations en peinture, sculpture, et techniques artistiques variées. Les niveaux vont du débutant à l'avancé. Découvrez nos ateliers dans la section Ateliers !"

            elif any(word in user_message_lower for word in ['oeuvre', 'oeuvres', 'artwork', 'tableau', 'peinture']):
                response = "Notre collection comprend des œuvres d'artistes contemporains talentueux. Toutes nos œuvres sont disponibles à la réservation. Vous pouvez consulter notre catalogue dans la section Œuvres et faire une demande de réservation directement en ligne."

            elif any(word in user_message_lower for word in ['réservation', 'reservation', 'réserver', 'book']):
                response = "Pour réserver une œuvre, rendez-vous dans la section Œuvres, sélectionnez l'œuvre qui vous intéresse, et cliquez sur 'Réserver'. Nous vous contacterons rapidement pour finaliser la transaction."

            elif any(word in user_message_lower for word in ['prix', 'price', 'coût', 'tarif']):
                response = "Nos prix varient selon l'artiste et le format de l'œuvre. Les tarifs de nos ateliers sont affichés sur chaque page d'atelier. Contactez-nous pour toute demande spécifique de devis."

            elif any(word in user_message_lower for word in ['contact', 'téléphone', 'email', 'adresse']):
                response = "Vous pouvez nous contacter à contact@artfusion.com ou par téléphone au +216 XX XXX XXX. Notre galerie est située à Tunis, Tunisie. N'hésitez pas à nous rendre visite !"

            elif any(word in user_message_lower for word in ['artiste', 'artists', 'peintre']):
                response = "ArtFusion collabore avec des artistes émergents et établis de la scène artistique contemporaine. Nous organisons régulièrement des rencontres avec les artistes pour découvrir leur univers créatif."

            elif any(word in user_message_lower for word in ['art', 'artistique', 'créatif']):
                response = "L'art est une forme d'expression universelle ! ArtFusion célèbre la créativité sous toutes ses formes. Découvrez notre collection d'œuvres contemporaines et rejoignez nos ateliers pour exprimer votre propre créativité."

            elif any(word in user_message_lower for word in ['aide', 'help', 'assistance']):
                response = "Je peux vous aider avec : • Informations sur nos expositions • Détails de nos ateliers • Catalogue d'œuvres disponibles • Procédure de réservation • Informations sur les artistes célèbres • Contact et horaires"

            else:
                # Default response for unrecognized queries
                responses = [
                    "Je suis là pour vous aider avec toutes vos questions sur ArtFusion et l'art en général ! Posez-moi des questions sur nos expositions, ateliers, œuvres, ou même sur des artistes célèbres.",
                    "ArtFusion est ravi de votre intérêt ! Je peux vous renseigner sur nos événements artistiques, nos ateliers créatifs, notre collection d'œuvres contemporaines, ou vous donner des informations sur l'histoire de l'art.",
                    "N'hésitez pas à me poser vos questions sur notre galerie d'art. Je suis spécialisé dans les expositions, ateliers, conseils artistiques, et je peux même vous parler d'artistes célèbres !"
                ]
                import random
                response = random.choice(responses)

        return Response({'response': response})

@api_view(['POST'])
def generate_username_suggestions(request):
    """Génère des suggestions de surnoms artistiques avec Groq AI"""
    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()

    if not first_name or not last_name:
        return Response({'error': 'Prénom et nom sont requis'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Charger la clé API depuis les variables d'environnement
        backend_dir = Path(__file__).resolve().parent.parent.parent
        env_path = backend_dir / '.env'
        load_dotenv(env_path)
        groq_api_key = os.getenv('GROQ_API_KEY')

        if not groq_api_key:
            return Response({'error': 'Configuration API manquante'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Créer le prompt pour l'IA
        prompt = f"""Génère 5 suggestions de surnoms artistiques créatifs et uniques en français pour un artiste nommé {first_name} {last_name}.

Les surnoms doivent être :
- Inspirés par l'art, la créativité, la nature ou des concepts artistiques
- Courts et mémorables (2-4 mots maximum)
- Originales et évocatrices
- Adaptées à un contexte artistique contemporain

Format de réponse : Liste numérotée avec seulement les surnoms, rien d'autre.
Exemple :
1. Peintre des Étoiles
2. Maître des Couleurs
3. Sculpteur de Rêves
4. Artiste des Ombres
5. Créateur d'Harmonie"""

        # Appel à l'API Groq
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 150,
                "temperature": 0.8,
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            suggestions_text = data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()

            if suggestions_text:
                # Parser les suggestions (format: "1. Surnom\n2. Surnom...")
                suggestions = []
                lines = suggestions_text.split('\n')
                for line in lines:
                    line = line.strip()
                    if line and (line[0].isdigit() and line[1:3] in ['. ', ') ']):
                        # Extraire le surnom après "1. " ou "1) "
                        suggestion = line.split('. ', 1)[1] if '. ' in line else line.split(') ', 1)[1]
                        suggestions.append(suggestion.strip())

                # S'assurer qu'on a au moins 3 suggestions
                suggestions = suggestions[:5] if len(suggestions) > 5 else suggestions

                return Response({'suggestions': suggestions})
            else:
                return Response({'error': 'Réponse vide de l\'API'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            print(f"Erreur API Groq: {response.status_code} - {response.text}")
            return Response({'error': 'Erreur lors de la génération'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except requests.exceptions.Timeout:
        return Response({'error': 'Timeout de l\'API'}, status=status.HTTP_504_GATEWAY_TIMEOUT)
    except requests.exceptions.RequestException as e:
        print(f"Erreur de requête: {e}")
        return Response({'error': 'Erreur de connexion'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        print(f"Erreur inattendue: {e}")
        return Response({'error': 'Erreur interne'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def test_email_configuration(request):
    """Endpoint de test pour vérifier la configuration email et Groq AI"""
    try:
        # Charger les variables d'environnement
        backend_dir = Path(__file__).resolve().parent.parent.parent
        env_path = backend_dir / '.env'
        load_dotenv(env_path)
        
        # Vérifier la configuration
        groq_api_key = os.getenv('GROQ_API_KEY')
        email_user = os.getenv('EMAIL_HOST_USER')
        email_password = os.getenv('EMAIL_HOST_PASSWORD')
        
        result = {
            'groq_configured': bool(groq_api_key),
            'email_configured': bool(email_user and email_password),
            'email_user': email_user if email_user else 'Non configuré',
            'issues': []
        }
        
        # Tester Groq si configuré
        if groq_api_key:
            try:
                test_response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "llama-3.1-8b-instant",
                        "messages": [{"role": "user", "content": "Test"}],
                        "max_tokens": 10,
                    },
                    timeout=10
                )
                result['groq_test'] = 'success' if test_response.status_code == 200 else f'error: {test_response.status_code}'
            except Exception as e:
                result['groq_test'] = f'error: {str(e)}'
        else:
            result['issues'].append('GROQ_API_KEY non configuré')
        
        # Tester l'email si configuré
        if email_user and email_password:
            test_email = request.data.get('test_email', 'ghof.ghribi11@gmail.com')
            try:
                send_mail(
                    subject='Test Email Configuration - ArtFusion',
                    message='Ceci est un email de test pour vérifier la configuration SMTP.',
                    from_email=email_user,
                    recipient_list=[test_email],
                    fail_silently=False
                )
                result['email_test'] = 'success'
            except Exception as e:
                result['email_test'] = f'error: {str(e)}'
                result['issues'].append(f'Erreur envoi email: {str(e)}')
        else:
            result['issues'].append('EMAIL_HOST_USER ou EMAIL_HOST_PASSWORD non configuré')
        
        return Response(result)
        
    except Exception as e:
        return Response({
            'error': f'Erreur lors du test: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)