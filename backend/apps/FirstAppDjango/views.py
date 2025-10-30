from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Event, Workshop, Rating, Artwork, Reservation, Comment
from .serializers import EventSerializer, WorkshopSerializer, RatingSerializer, ArtworkSerializer, ReservationSerializer, ReservationCreateSerializer, CommentSerializer, CommentCreateSerializer

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

@api_view(['GET', 'POST'])
def comment_list_create(request):
    if request.method == 'GET':
        comments = Comment.objects.all()
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = CommentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            comment = serializer.save()

            # Modérer automatiquement le contenu après création
            comment.moderate_content()

            response_serializer = CommentSerializer(comment)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def comment_check_moderation(request):
    """Vérifier la modération d'un commentaire avant sauvegarde en utilisant Groq API"""
    content = request.data.get('content', '')

    if not content:
        return Response({'error': 'Contenu requis'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        import os
        from groq import Groq

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
        - summary: résumé court du commentaire

        Commentaire: "{content}"
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

        return Response({
            'status': result.get('status', 'pending'),
            'message': result.get('reason', 'Contenu analysé'),
            'sentiment': result.get('sentiment', 'neutral'),
            'summary': result.get('summary', f'Commentaire de {len(content)} caractères'),
            'categories': result.get('categories', [])
        })

    except Exception as e:
        # Fallback vers la modération par mots-clés
        print(f"Erreur Groq API: {e}")
        inappropriate_words = [
            'nul', 'nulle', 'merde', 'idiot', 'stupide', 'horrible', 'dégoût',
            'suce', 'enculé', 'connard', 'salope', 'pute', 'bordel', 'putain',
            'fuck', 'shit', 'asshole', 'bitch', 'damn', 'hell', 'crap'
        ]

        content_lower = content.lower()
        found_inappropriate = [word for word in inappropriate_words if word in content_lower]

        if found_inappropriate:
            return Response({
                'status': 'rejected',
                'message': f'Contenu inapproprié détecté: {", ".join(found_inappropriate)}',
                'categories': found_inappropriate,
                'sentiment': 'negative',
                'summary': f'Commentaire négatif ({len(content)} caractères)'
            })
        else:
            return Response({
                'status': 'approved',
                'message': 'Contenu approprié',
                'sentiment': 'neutral',
                'summary': f'Commentaire de {len(content)} caractères',
                'categories': []
            })

@api_view(['GET', 'PUT', 'DELETE'])
def comment_detail(request, pk):
    try:
        comment = Comment.objects.get(pk=pk)
    except Comment.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = CommentSerializer(comment)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = CommentSerializer(comment, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
def comment_moderate(request, pk):
    try:
        comment = Comment.objects.get(pk=pk)
    except Comment.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    # Modérer automatiquement le contenu
    comment.moderate_content()
    serializer = CommentSerializer(comment)
    return Response(serializer.data)

@api_view(['PATCH'])
def comment_update_moderation(request, pk):
    try:
        comment = Comment.objects.get(pk=pk)
    except Comment.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    moderation_status = request.data.get('moderation_status')
    moderation_reason = request.data.get('moderation_reason', '')

    if moderation_status in ['approved', 'rejected', 'flagged']:
        comment.moderation_status = moderation_status
        if moderation_reason:
            comment.moderation_reason = moderation_reason
        comment.save()

        serializer = CommentSerializer(comment)
        return Response(serializer.data)
    else:
        return Response(
            {'error': 'Statut de modération invalide'},
            status=status.HTTP_400_BAD_REQUEST
        )
