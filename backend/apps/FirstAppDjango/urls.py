from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.UserCreateView.as_view(), name='user-create'),
    path('login/', views.LoginView.as_view(), name='user-login'),
    path('forgot-password-request/', views.PasswordResetRequestView.as_view(), name='user-forgot-password-request'),
    path('forgot-password-confirm/', views.PasswordResetConfirmView.as_view(), name='user-forgot-password-confirm'),
    path('profile-update/', views.ProfileUpdateView.as_view(), name='user-update-profile'),
    path('myprofile/', views.GetMyselfAPIView.as_view(), name='user-get-my-profile'),



    # Événements
    path('events/', views.event_list_create, name='event-list-create'),
    path('events/<int:pk>/', views.event_detail, name='event-detail'),
    path('events/<int:event_id>/ratings/', views.event_ratings, name='event-ratings'),

    # Ateliers
    path('workshops/', views.workshop_list_create, name='workshop-list-create'),
    path('workshops/<int:pk>/', views.workshop_detail, name='workshop-detail'),

    # Participants
    path('event-participants/', views.event_participants, name='event-participants'),
    path('workshop-participants/', views.workshop_participants, name='workshop-participants'),

    # Œuvres et réservations
    path('artworks/', views.artwork_list_create, name='artwork-list-create'),
    path('artworks/<int:pk>/', views.artwork_detail, name='artwork-detail'),
    path('artworks/<int:pk>/analyze/', views.analyze_artwork_colors, name='artwork-analyze-colors'),
    path('reservations/', views.reservation_list_create, name='reservation-list-create'),
    path('reservations/<int:pk>/', views.reservation_detail, name='reservation-detail'),

    # Chatbot
    path('chatbot/', views.ChatbotView.as_view(), name='chatbot'),

    # IA - Génération de contenu
    path('ai/generate-event-description/', views.generate_event_description, name='generate-event-description'),
    path('ai/generate-workshop-summary/', views.generate_workshop_summary, name='generate-workshop-summary'),
    path('ai/generate-username-suggestions/', views.generate_username_suggestions, name='generate-username-suggestions'),
    
    # Test - Configuration
    path('test/email-config/', views.test_email_configuration, name='test-email-config'),
]