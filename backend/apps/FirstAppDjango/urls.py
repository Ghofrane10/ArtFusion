from django.urls import path
from . import views

urlpatterns = [
    # Événements
    path('events/', views.event_list_create, name='event-list-create'),
    path('events/<int:pk>/', views.event_detail, name='event-detail'),
    path('events/<int:event_id>/ratings/', views.event_ratings, name='event-ratings'),

    # Ateliers
    path('workshops/', views.workshop_list_create, name='workshop-list-create'),
    path('workshops/<int:pk>/', views.workshop_detail, name='workshop-detail'),

    # Œuvres et réservations
    path('artworks/', views.artwork_list_create, name='artwork-list-create'),
    path('artworks/<int:pk>/', views.artwork_detail, name='artwork-detail'),
    path('reservations/', views.reservation_list_create, name='reservation-list-create'),
    path('reservations/<int:pk>/', views.reservation_detail, name='reservation-detail'),

    # Commentaires
    path('comments/', views.comment_list_create, name='comment-list-create'),
    path('comments/<int:pk>/', views.comment_detail, name='comment-detail'),
    path('comments/<int:pk>/moderate/', views.comment_moderate, name='comment-moderate'),
    path('comments/<int:pk>/update-moderation/', views.comment_update_moderation, name='comment-update-moderation'),
    path('comments/check-moderation/', views.comment_check_moderation, name='comment-check-moderation'),
]