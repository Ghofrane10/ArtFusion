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
]