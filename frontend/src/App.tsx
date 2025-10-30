import { useState, useEffect, useRef } from "react";
import "./App.css";
import {
  ArtworkList,
  ArtworkCreate,
  ReservationList,
  ReservationCreate,
  Artwork,
  Reservation,
  ArtworkListRef,
  ReservationListRef,
} from "./modules/reservations";
import LoginForm from "./modules/login/LoginForm";
import SignupForm from "./modules/login/SignupForm";
import ForgotPasswordForm from "./modules/login/ForgotPasswordForm";
import ProfileMenu from "./components/ProfileMenu";
import Chatbot from "./components/Chatbot";
import ColorAnalysisModal from "./components/ColorAnalysisModal";

interface Rating {
  id: number;
  value: number;
  comment: string;
  created_at: string;
}

interface Event {
   id: number;
   title: string;
   description: string;
   start_date: string;
   end_date: string;
   location: string;
   image: string | null;
   capacity: number;
   price: string;
   average_rating: number;
   ratings: Rating[];
   participants_count?: number;
 }

interface Workshop {
   id: number;
   title: string;
   description: string;
   start_date: string;
   end_date: string;
   location: string;
   image: string | null;
   capacity: number;
   price: string;
   level: string;
   duration: string;
   materials_provided: string;
   instructor: string;
   participants_count?: number;
 }

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showWorkshopForm, setShowWorkshopForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>(''); // 'Artist' or 'Visiteur'
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);

  const handleSignupSuccess = () => {
    setShowSignupForm(false);
    setShowLoginForm(true);
  };

  const handleLoginSuccess = (token: string, userData: any) => {
    setUser(userData);
    setShowLoginForm(false);
    localStorage.setItem("access_token", token);
    console.log("User logged in:", userData);
  };

  const handleForgotPasswordSuccess = () => {
    setShowForgotPasswordForm(false);
    setShowLoginForm(true);
  };

  // Récupérer les données utilisateur
  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/myprofile/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setUserRole(userData.category); // Set user role
        console.log("User data loaded:", userData);
      } else {
        // Token invalide ou expiré
        localStorage.removeItem("access_token");
        setUser(null);
        setUserRole('');
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des données utilisateur:",
        error
      );
    }
  };

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    console.log("Token from localStorage:", token ? "Found" : "Not found");
    if (token) {
      fetchUserData(token);
    }
  }, []);

  // Debug pour voir l'état de user
  useEffect(() => {
    console.log("User state:", user);
  }, [user]);

  // États pour les formulaires
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    capacity: 0,
    price: "0.00",
    image: null as File | null,
  });

  const [eventFormErrors, setEventFormErrors] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    capacity: "",
    price: "",
  });

  const [workshopForm, setWorkshopForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    capacity: 0,
    price: "0.00",
    level: "beginner",
    duration: "",
    materials_provided: "",
    instructor: "",
    image: null as File | null,
  });

  const [workshopFormErrors, setWorkshopFormErrors] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    capacity: "",
    price: "",
    level: "",
    duration: "",
    materials_provided: "",
    instructor: "",
  });

  // États pour l'édition
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [showRatingForm, setShowRatingForm] = useState<number | null>(null);
  const [ratingForm, setRatingForm] = useState({
    value: 5,
    comment: "",
  });
  const [hoveredRating, setHoveredRating] = useState(0);

  // États pour les modals de détails
  const [showEventModal, setShowEventModal] = useState<Event | null>(null);
  const [showWorkshopModal, setShowWorkshopModal] = useState<Workshop | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [workshopSummary, setWorkshopSummary] = useState<string>("");
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // États pour la génération IA
  const [generatingDescription, setGeneratingDescription] = useState(false);

  // États pour les formulaires de participation
  const [showParticipationForm, setShowParticipationForm] = useState<{type: 'event' | 'workshop', id: number} | null>(null);
  const [participationForm, setParticipationForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [submittingParticipation, setSubmittingParticipation] = useState(false);

  // États pour les réservations
  const [showArtworkForm, setShowArtworkForm] = useState<Artwork | null>(null);
  const [showReservationForm, setShowReservationForm] =
    useState<Artwork | null>(null);

  // États pour le calendrier
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Références pour rafraîchir les listes
  const artworkListRef = useRef<ArtworkListRef>(null);
  const reservationListRef = useRef<ReservationListRef>(null);

  // États pour la modal d'analyse des couleurs
  const [showColorModal, setShowColorModal] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchWorkshops();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/events/");
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
    }
  };

  const fetchWorkshops = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/workshops/");
      const data = await response.json();
      setWorkshops(data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des ateliers:", error);
      setLoading(false);
    }
  };

  // Fonction pour générer une description poétique via le backend
  const generatePoeticDescription = async (title: string) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/ai/generate-event-description/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.description || "";
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur API backend:", response.status, errorData);
        return "";
      }
    } catch (error) {
      console.error("Erreur lors de la génération de description:", error);
      return "";
    }
  };

  // Fonction pour générer un résumé encourageant pour les ateliers via le backend
  const generateWorkshopSummary = async (workshop: Workshop) => {
    setGeneratingSummary(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/ai/generate-workshop-summary/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: workshop.title,
          description: workshop.description,
          instructor: workshop.instructor,
          level: workshop.level,
          duration: workshop.duration,
          location: workshop.location,
          price: workshop.price,
          materials_provided: workshop.materials_provided
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWorkshopSummary(data.summary || "Erreur lors de la génération du résumé.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur API backend:", response.status, errorData);
        setWorkshopSummary("Erreur lors de la génération du résumé. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Erreur lors de la génération du résumé:", error);
      setWorkshopSummary("Erreur de connexion. Veuillez vérifier votre connexion internet.");
    }
    setGeneratingSummary(false);
  };

  // Fonction pour générer une description dans le formulaire
  const handleGenerateDescription = async () => {
    setGeneratingDescription(true);
    try {
      const generatedDescription = await generatePoeticDescription(eventForm.title);
      if (generatedDescription) {
        setEventForm({ ...eventForm, description: generatedDescription });
      } else {
        alert("Erreur lors de la génération de la description. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Erreur lors de la génération de description:", error);
      alert("Erreur lors de la génération de la description.");
    }
    setGeneratingDescription(false);
  };

  // Fonction pour gérer la participation
  const handleParticipationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showParticipationForm) return;

    setSubmittingParticipation(true);
    try {
      const endpoint = showParticipationForm.type === 'event' ? 'event-participants' : 'workshop-participants';
      const data = {
        [showParticipationForm.type === 'event' ? 'event' : 'workshop']: showParticipationForm.id,
        ...participationForm
      };

      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://127.0.0.1:8000/api/${endpoint}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("Votre participation a été enregistrée avec succès !");
        setShowParticipationForm(null);
        setParticipationForm({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
        });
        // Rafraîchir les données pour mettre à jour le nombre de participants
        fetchEvents();
        fetchWorkshops();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Erreur lors de l'inscription: ${errorData.error || "Erreur inconnue"}`);
      }
    } catch (error) {
      console.error("Erreur lors de la participation:", error);
      alert("Erreur de connexion. Veuillez vérifier votre connexion internet.");
    }
    setSubmittingParticipation(false);
  };

  // Fonction de validation pour les événements
   const validateEventForm = () => {
     const errors = {
       title: "",
       description: "",
       start_date: "",
       end_date: "",
       location: "",
       capacity: "",
       price: "",
     };

     // Validation côté frontend (messages utilisateur)
     if (!eventForm.title.trim()) {
       errors.title = "Le titre est obligatoire";
     } else if (eventForm.title.trim().length < 3) {
       errors.title = "Le titre doit contenir au moins 3 caractères";
     }

     if (!eventForm.description.trim()) {
       errors.description = "La description est obligatoire";
     }

     if (!eventForm.start_date) {
       errors.start_date = "La date de début est obligatoire";
     }

     if (!eventForm.end_date) {
       errors.end_date = "La date de fin est obligatoire";
     }

     if (eventForm.start_date && eventForm.end_date && new Date(eventForm.start_date) >= new Date(eventForm.end_date)) {
       errors.end_date = "La date de fin doit être après la date de début";
     }

     if (!eventForm.location.trim()) {
       errors.location = "Le lieu est obligatoire";
     }

     if (eventForm.capacity <= 0) {
       errors.capacity = "La capacité doit être supérieure à 0";
     }

     if (parseFloat(eventForm.price) < 0) {
       errors.price = "Le prix ne peut pas être négatif";
     }

     setEventFormErrors(errors);
     return Object.values(errors).every(error => error === "");
   };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEventForm()) {
      return;
    }

    // Check if user is Artist
    if (userRole !== 'Artist') {
      alert("Seuls les artistes peuvent créer ou modifier des événements.");
      return;
    }

    setSubmitting(true);
    try {
      // Générer une description poétique si aucune description n'est fournie
      let description = eventForm.description;
      if (!description.trim()) {
        description = await generatePoeticDescription(eventForm.title);
      }

      const formData = new FormData();
      formData.append("title", eventForm.title);
      formData.append("description", description);
      formData.append("start_date", eventForm.start_date);
      formData.append("end_date", eventForm.end_date);
      formData.append("location", eventForm.location);
      formData.append("capacity", eventForm.capacity.toString());
      formData.append("price", eventForm.price);
      if (eventForm.image) {
        formData.append("image", eventForm.image);
      }

      const url = editingEvent
        ? `http://127.0.0.1:8000/api/events/${editingEvent.id}/`
        : "http://127.0.0.1:8000/api/events/";

      const method = editingEvent ? "PUT" : "POST";

      const token = localStorage.getItem("access_token");
      const response = await fetch(url, {
        method: method,
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
        body: formData,
      });

      if (response.ok) {
        await fetchEvents();
        setShowEventForm(false);
        setEditingEvent(null);
        setEventForm({
          title: "",
          description: "",
          start_date: "",
          end_date: "",
          location: "",
          capacity: 0,
          price: "0.00",
          image: null,
        });
        setEventFormErrors({
          title: "",
          description: "",
          start_date: "",
          end_date: "",
          location: "",
          capacity: "",
          price: "",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur lors de la sauvegarde de l'événement:", errorData);

        // Afficher les erreurs du backend
        if (errorData.detail) {
          alert(`Erreur: ${errorData.detail}`);
        } else if (errorData.non_field_errors) {
          alert(`Erreur: ${errorData.non_field_errors.join(', ')}`);
        } else {
          // Afficher les erreurs de champs spécifiques
          const fieldErrors = Object.entries(errorData).map(([field, errors]) =>
            `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`
          ).join('\n');
          if (fieldErrors) {
            alert(`Erreurs de validation:\n${fieldErrors}`);
          } else {
            alert("Erreur lors de la sauvegarde de l'événement");
          }
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
    setSubmitting(false);
  };

  // Fonction de validation pour les ateliers
   const validateWorkshopForm = () => {
     const errors = {
       title: "",
       description: "",
       start_date: "",
       end_date: "",
       location: "",
       capacity: "",
       price: "",
       level: "",
       duration: "",
       materials_provided: "",
       instructor: "",
     };

     // Validation côté frontend (messages utilisateur)
     if (!workshopForm.title.trim()) {
       errors.title = "Le titre est obligatoire";
     } else if (workshopForm.title.trim().length < 3) {
       errors.title = "Le titre doit contenir au moins 3 caractères";
     }

     if (!workshopForm.description.trim()) {
       errors.description = "La description est obligatoire";
     }

     if (!workshopForm.start_date) {
       errors.start_date = "La date de début est obligatoire";
     }

     if (!workshopForm.end_date) {
       errors.end_date = "La date de fin est obligatoire";
     }

     if (workshopForm.start_date && workshopForm.end_date && new Date(workshopForm.start_date) >= new Date(workshopForm.end_date)) {
       errors.end_date = "La date de fin doit être après la date de début";
     }

     if (!workshopForm.location.trim()) {
       errors.location = "Le lieu est obligatoire";
     }

     if (workshopForm.capacity <= 0) {
       errors.capacity = "La capacité doit être supérieure à 0";
     }

     if (parseFloat(workshopForm.price) < 0) {
       errors.price = "Le prix ne peut pas être négatif";
     }

     if (!workshopForm.level) {
       errors.level = "Le niveau est obligatoire";
     }

     if (!workshopForm.duration.trim()) {
       errors.duration = "La durée est obligatoire";
     }

     if (!workshopForm.instructor.trim()) {
       errors.instructor = "L'instructeur est obligatoire";
     }

     setWorkshopFormErrors(errors);
     return Object.values(errors).every(error => error === "");
   };

  const handleWorkshopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateWorkshopForm()) {
      return;
    }

    // Check if user is Artist
    if (userRole !== 'Artist') {
      alert("Seuls les artistes peuvent créer ou modifier des ateliers.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", workshopForm.title);
      formData.append("description", workshopForm.description);
      formData.append("start_date", workshopForm.start_date);
      formData.append("end_date", workshopForm.end_date);
      formData.append("location", workshopForm.location);
      formData.append("capacity", workshopForm.capacity.toString());
      formData.append("price", workshopForm.price);
      formData.append("level", workshopForm.level);
      formData.append("duration", workshopForm.duration);
      formData.append("materials_provided", workshopForm.materials_provided);
      formData.append("instructor", workshopForm.instructor);
      if (workshopForm.image) {
        formData.append("image", workshopForm.image);
      }

      const url = editingWorkshop
        ? `http://127.0.0.1:8000/api/workshops/${editingWorkshop.id}/`
        : "http://127.0.0.1:8000/api/workshops/";

      const method = editingWorkshop ? "PUT" : "POST";

      const token = localStorage.getItem("access_token");
      const response = await fetch(url, {
        method: method,
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
        body: formData,
      });

      if (response.ok) {
        await fetchWorkshops();
        setShowWorkshopForm(false);
        setEditingWorkshop(null);
        setWorkshopForm({
          title: "",
          description: "",
          start_date: "",
          end_date: "",
          location: "",
          capacity: 0,
          price: "0.00",
          level: "beginner",
          duration: "",
          materials_provided: "",
          instructor: "",
          image: null,
        });
        setWorkshopFormErrors({
          title: "",
          description: "",
          start_date: "",
          end_date: "",
          location: "",
          capacity: "",
          price: "",
          level: "",
          duration: "",
          materials_provided: "",
          instructor: "",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erreur lors de la sauvegarde de l'atelier:", errorData);

        // Afficher les erreurs du backend
        if (errorData.detail) {
          alert(`Erreur: ${errorData.detail}`);
        } else if (errorData.non_field_errors) {
          alert(`Erreur: ${errorData.non_field_errors.join(', ')}`);
        } else {
          // Afficher les erreurs de champs spécifiques
          const fieldErrors = Object.entries(errorData).map(([field, errors]) =>
            `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`
          ).join('\n');
          if (fieldErrors) {
            alert(`Erreurs de validation:\n${fieldErrors}`);
          } else {
            alert("Erreur lors de la sauvegarde de l'atelier");
          }
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
    setSubmitting(false);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      start_date: event.start_date.slice(0, 16), // Format pour datetime-local
      end_date: event.end_date.slice(0, 16),
      location: event.location,
      capacity: event.capacity,
      price: event.price,
      image: null,
    });
    setShowEventForm(true);
  };

  const handleEditWorkshop = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setWorkshopForm({
      title: workshop.title,
      description: workshop.description,
      start_date: workshop.start_date.slice(0, 16),
      end_date: workshop.end_date.slice(0, 16),
      location: workshop.location,
      capacity: workshop.capacity,
      price: workshop.price,
      level: workshop.level,
      duration: workshop.duration,
      materials_provided: workshop.materials_provided,
      instructor: workshop.instructor,
      image: null,
    });
    setShowWorkshopForm(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    // Check if user is Artist
    if (userRole !== 'Artist') {
      alert("Seuls les artistes peuvent supprimer des événements.");
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `http://127.0.0.1:8000/api/events/${eventId}/`,
          {
            method: "DELETE",
            headers: token ? {
              Authorization: `Bearer ${token}`,
            } : {},
          }
        );
        if (response.ok) {
          await fetchEvents();
        } else {
          console.error("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  const handleDeleteWorkshop = async (workshopId: number) => {
    // Check if user is Artist
    if (userRole !== 'Artist') {
      alert("Seuls les artistes peuvent supprimer des ateliers.");
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet atelier ?")) {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `http://127.0.0.1:8000/api/workshops/${workshopId}/`,
          {
            method: "DELETE",
            headers: token ? {
              Authorization: `Bearer ${token}`,
            } : {},
          }
        );
        if (response.ok) {
          await fetchWorkshops();
        } else {
          console.error("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  const handleRatingSubmit = async (eventId: number, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:8000/api/events/${eventId}/ratings/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(ratingForm),
        }
      );

      if (response.ok) {
        await fetchEvents();
        setShowRatingForm(null);
        setRatingForm({ value: 5, comment: "" });
      } else {
        console.error("Erreur lors de l'ajout du rating");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? "star filled" : "star"}>
        ★
      </span>
    ));
  };

  // Gestionnaires pour les réservations
  const handleArtworkSave = async (
    artworkData: Omit<Artwork, "id" | "created_at" | "image"> & {
      image: File | null;
    }
  ) => {
    if (!showArtworkForm) return;

    // Check if user is Artist
    if (userRole !== 'Artist') {
      alert("Seuls les artistes peuvent créer ou modifier des œuvres.");
      return;
    }

    const formData = new FormData();
    formData.append("title", artworkData.title);
    formData.append("description", artworkData.description);
    formData.append(
      "quantity_available",
      artworkData.quantity_available.toString()
    );
    formData.append("price", artworkData.price);
    if (artworkData.image) {
      formData.append("image", artworkData.image);
    }

    const url = showArtworkForm.id
      ? `http://127.0.0.1:8000/api/artworks/${showArtworkForm.id}/`
      : "http://127.0.0.1:8000/api/artworks/";

    const method = showArtworkForm.id ? "PUT" : "POST";

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(url, {
        method: method,
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
        body: formData,
      });

      if (response.ok) {
        const newArtwork = await response.json();
        console.log("Artwork saved successfully with colors:", newArtwork);
        setShowArtworkForm(null);
        // Refresh immediately since colors are processed in the API response
        artworkListRef.current?.refresh();
      } else {
        console.error("Erreur lors de la sauvegarde de l'œuvre");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleArtworkEdit = (artwork: Artwork) => {
    setShowArtworkForm(artwork);
  };

  const handleArtworkDelete = async (artworkId: number) => {
    // Check if user is Artist
    if (userRole !== 'Artist') {
      alert("Seuls les artistes peuvent supprimer des œuvres.");
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette œuvre ?")) {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `http://127.0.0.1:8000/api/artworks/${artworkId}/`,
          {
            method: "DELETE",
            headers: token ? {
              Authorization: `Bearer ${token}`,
            } : {},
          }
        );
        if (response.ok) {
          // Rafraîchir la liste des œuvres après suppression
          artworkListRef.current?.refresh();
        } else {
          console.error("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  const handleReservationSave = async (reservationData: {
    artwork_id: number;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    quantity: number;
    notes?: string;
  }) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Vous devez être connecté pour effectuer une réservation.");
        return;
      }

      const dataToSend = {
        artwork: reservationData.artwork_id,
        full_name: reservationData.full_name,
        email: reservationData.email,
        phone: reservationData.phone,
        address: reservationData.address,
        quantity: reservationData.quantity,
        notes: reservationData.notes || "",
      };

      console.log("Données envoyées:", dataToSend);

      const response = await fetch("http://127.0.0.1:8000/api/reservations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Réservation créée:", result);
        setShowReservationForm(null);
        // Rafraîchir les listes après une réservation réussie
        artworkListRef.current?.refresh();
        reservationListRef.current?.refresh();
      } else {
        const errorData = await response.json();
        console.error("Erreur lors de la réservation:", errorData);
        alert(
          `Erreur lors de la réservation: ${
            errorData.detail || errorData.error || "Erreur inconnue"
          }`
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur de connexion. Veuillez vérifier votre connexion internet.");
    }
  };

  const handleReservationStatusChange = async (
    reservationId: number,
    status: Reservation["status"]
  ) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Vous devez être connecté pour modifier le statut d'une réservation.");
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/reservations/${reservationId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        // Rafraîchir les listes après changement de statut
        artworkListRef.current?.refresh();
        reservationListRef.current?.refresh();
      } else {
        const errorData = await response.json();
        console.error("Erreur lors de la mise à jour du statut:", errorData);
        alert(`Erreur lors de la mise à jour du statut: ${errorData.detail || "Erreur inconnue"}`);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur de connexion. Veuillez vérifier votre connexion internet.");
    }
  };

  const handleReservationDelete = async (reservationId: number) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")
    ) {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          alert("Vous devez être connecté pour supprimer une réservation.");
          return;
        }

        const response = await fetch(
          `http://127.0.0.1:8000/api/reservations/${reservationId}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          // Rafraîchir les listes après suppression
          artworkListRef.current?.refresh();
          reservationListRef.current?.refresh();
        } else {
          const errorData = await response.json();
          console.error("Erreur lors de la suppression:", errorData);
          alert(`Erreur lors de la suppression: ${errorData.detail || "Erreur inconnue"}`);
        }
      } catch (error) {
        console.error("Erreur:", error);
        alert("Erreur de connexion. Veuillez vérifier votre connexion internet.");
      }
    }
  };

  // Gestionnaire pour l'analyse des couleurs
  const handleAnalyzeColors = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setShowColorModal(true);
  };

  const handleColorAnalysis = async (artworkId: number): Promise<string[]> => {
    console.log('handleColorAnalysis called with artworkId:', artworkId);
    try {
      console.log('Making API call to:', `http://127.0.0.1:8000/api/artworks/${artworkId}/analyze/`);
      const response = await fetch(`http://127.0.0.1:8000/api/artworks/${artworkId}/analyze/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Color analysis completed - full response:', data);
        console.log('Color palette from response:', data.color_palette);
        console.log('Type of color_palette:', typeof data.color_palette);
        console.log('Length of color_palette:', data.color_palette ? data.color_palette.length : 'null/undefined');

        // Refresh the artwork list to show the new colors
        artworkListRef.current?.refresh();
        return data.color_palette || [];
      } else {
        const errorText = await response.text();
        console.error('Color analysis failed - raw response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('Color analysis failed - parsed error:', errorData);
          throw new Error(errorData.error || 'Analysis failed');
        } catch (parseError) {
          console.error('Could not parse error response as JSON');
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error during color analysis:', error);
      throw error;
    }
  };


  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    setUserRole('');
    window.location.hash = "#";
  };

  // Fonctions pour le calendrier
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Ajouter les jours vides du début du mois
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Ajouter tous les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayEvents = events.filter(event =>
      event.start_date.startsWith(dateStr) || event.end_date.startsWith(dateStr)
    );
    const dayWorkshops = workshops.filter(workshop =>
      workshop.start_date.startsWith(dateStr) || workshop.end_date.startsWith(dateStr)
    );
    return [...dayEvents, ...dayWorkshops];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  const isLoggedIn = !!localStorage.getItem("access_token");

  return (
    <div className="app">
      <header className="main-header">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>ArtFusion</h1>
            <span className="tagline">Galerie d'Art Contemporain</span>
          </div>
          <ul className="nav-menu">
            {isLoggedIn ? (
              // Liens affichés quand l'utilisateur est connecté
              <>
                <li>
                  <a href="#events" className="nav-link">
                    Événements
                  </a>
                </li>
                <li>
                  <a href="#workshops" className="nav-link">
                    Ateliers
                  </a>
                </li>
                <li>
                  <a href="#oeuvres" className="nav-link">
                    Oeuvre
                  </a>
                </li>
                <li>
                  <a href="#reservations" className="nav-link">
                    Réservations
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setShowCalendarModal(true)}
                    className="nav-link"
                    style={{
                      background: "none",
                      border: "none",
                      color: "inherit",
                      cursor: "pointer",
                      padding: "0.5rem 0",
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      letterSpacing: "0.5px",
                    }}
                  >
                    📅 Calendrier
                  </button>
                </li>
                <li>
                  <a href="#about" className="nav-link">
                    À propos
                  </a>
                </li>
                <li>
                  {user && <ProfileMenu user={user} onLogout={handleLogout} />}
                </li>
              </>
            ) : (
              // Liens affichés quand l'utilisateur n'est pas connecté
              <>
                <li>
                  <button
                    onClick={() => setShowCalendarModal(true)}
                    className="nav-link"
                    style={{
                      background: "none",
                      border: "none",
                      color: "inherit",
                      cursor: "pointer",
                      padding: "0.5rem 0",
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      letterSpacing: "0.5px",
                    }}
                  >
                    📅 Calendrier
                  </button>
                </li>
                <li>
                  <a href="#about" className="nav-link">
                    À propos
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setShowLoginForm(true)}
                    className="nav-link"
                    style={{
                      background: "none",
                      border: "none",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    Se connecter
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowSignupForm(true)}
                    className="nav-link"
                    style={{
                      background: "none",
                      border: "none",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    Créer un Compte
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h2>Découvrez l'Art Vivant</h2>
          <p>
            Explorez nos expositions, vernissages et ateliers artistiques
            uniques
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">{events.length}</span>
              <span className="stat-label">Événements</span>
            </div>
            <div className="stat">
              <span className="stat-number">{workshops.length}</span>
              <span className="stat-label">Ateliers</span>
            </div>
            <div className="stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Artistes</span>
            </div>
          </div>
        </div>
      </section>

      <main>
        {isLoggedIn ? (
          // Contenu affiché quand l'utilisateur est connecté
          <>
            <section id="events" className="events-section">
              <div className="container">
                <div className="section-header">
                  <div className="section-title">
                    <h2>Événements à Venir</h2>
                    <p>Découvrez nos expositions et vernissages exclusifs</p>
                  </div>
                  {userRole === 'Artist' && (
                    <button
                      className="add-button primary"
                      onClick={() => setShowEventForm(!showEventForm)}
                    >
                      {showEventForm ? "Annuler" : "+ Ajouter un événement"}
                    </button>
                  )}
                </div>

                {showEventForm && (
                  <form className="add-form" onSubmit={handleEventSubmit}>
                    <div className="form-group">
                      <label>Titre:</label>
                      <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, title: e.target.value })
                        }
                        required
                      />
                      {eventFormErrors.title && (
                        <div className="error-message">{eventFormErrors.title}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Description:</label>
                      <div className="description-input-group">
                        <textarea
                          value={eventForm.description}
                          onChange={(e) =>
                            setEventForm({
                              ...eventForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Décrivez votre événement ou laissez l'IA le faire pour vous..."
                        />
                        <button
                          type="button"
                          className="generate-ai-button"
                          onClick={handleGenerateDescription}
                          disabled={generatingDescription}
                        >
                          {generatingDescription ? "⏳ Génération..." : "🤖 Générer avec IA"}
                        </button>
                      </div>
                      {eventFormErrors.description && (
                        <div className="error-message">{eventFormErrors.description}</div>
                      )}
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Date de début:</label>
                        <input
                          type="datetime-local"
                          value={eventForm.start_date}
                          onChange={(e) =>
                            setEventForm({
                              ...eventForm,
                              start_date: e.target.value,
                            })
                          }
                          required
                        />
                        {eventFormErrors.start_date && (
                          <div className="error-message">{eventFormErrors.start_date}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Date de fin:</label>
                        <input
                          type="datetime-local"
                          value={eventForm.end_date}
                          onChange={(e) =>
                            setEventForm({
                              ...eventForm,
                              end_date: e.target.value,
                            })
                          }
                          required
                        />
                        {eventFormErrors.end_date && (
                          <div className="error-message">{eventFormErrors.end_date}</div>
                        )}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Lieu:</label>
                        <input
                          type="text"
                          value={eventForm.location}
                          onChange={(e) =>
                            setEventForm({
                              ...eventForm,
                              location: e.target.value,
                            })
                          }
                          required
                        />
                        {eventFormErrors.location && (
                          <div className="error-message">{eventFormErrors.location}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Capacité:</label>
                        <input
                          type="number"
                          value={eventForm.capacity}
                          onChange={(e) =>
                            setEventForm({
                              ...eventForm,
                              capacity: parseInt(e.target.value),
                            })
                          }
                          required
                        />
                        {eventFormErrors.capacity && (
                          <div className="error-message">{eventFormErrors.capacity}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Prix (€):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={eventForm.price}
                          onChange={(e) =>
                            setEventForm({
                              ...eventForm,
                              price: e.target.value,
                            })
                          }
                          required
                        />
                        {eventFormErrors.price && (
                          <div className="error-message">{eventFormErrors.price}</div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Image:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            image: e.target.files ? e.target.files[0] : null,
                          })
                        }
                      />
                    </div>
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Sauvegarde en cours..."
                        : editingEvent
                        ? "Modifier l'événement"
                        : "Ajouter l'événement"}
                    </button>
                  </form>
                )}

                <div className="events-grid">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="event-card"
                      onClick={(e) => {
                        // Empêcher l'ouverture du modal si on clique sur les boutons edit/delete
                        if ((e.target as HTMLElement).closest('.card-button')) {
                          return;
                        }
                        setShowEventModal(event);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="card-image">
                        {event.image ? (
                          <img
                            src={`http://127.0.0.1:8000${event.image}`}
                            alt={event.title}
                          />
                        ) : (
                          <div className="image-placeholder">
                            <span>🎨</span>
                          </div>
                        )}
                        <div className="card-badge">Événement</div>
                      </div>
                      <div className="card-content">
                        <h3>{event.title}</h3>
                        <div className="card-details">
                          <div className="detail-item">
                            <span className="detail-icon">📍</span>
                            <span>{event.location}</span>
                          </div>
                        </div>
                        <div className="card-footer">
                          <div className="rating-section">
                            <div className="rating-display">
                              {renderStars(Math.round(event.average_rating))}
                              <span className="rating-score">
                                (
                                {event.average_rating
                                  ? event.average_rating.toFixed(1)
                                  : "0.0"}
                                )
                              </span>
                            </div>
                            <button
                              className="rate-button"
                              onClick={() =>
                                setShowRatingForm(
                                  showRatingForm === event.id ? null : event.id
                                )
                              }
                            >
                              ⭐ Noter
                            </button>
                          </div>
                        </div>
                        <div className="card-actions">
                          {userRole === 'Artist' && (
                            <>
                              <button
                                className="card-button edit"
                                onClick={() => handleEditEvent(event)}
                              >
                                ✏️
                              </button>
                              <button
                                className="card-button delete"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>

                        {showRatingForm === event.id && (
                          <div className="rating-form-overlay">
                            <form
                              className="rating-form"
                              onSubmit={(e) => handleRatingSubmit(event.id, e)}
                            >
                              <h4>Noter cet événement</h4>
                              <div className="rating-input">
                                <label>Note:</label>
                                <div className="star-rating">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      className={`star-button ${
                                        star <=
                                        (hoveredRating || ratingForm.value)
                                          ? "active"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        setRatingForm({
                                          ...ratingForm,
                                          value: star,
                                        })
                                      }
                                      onMouseEnter={() =>
                                        setHoveredRating(star)
                                      }
                                      onMouseLeave={() => setHoveredRating(0)}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                                <div className="rating-value-display">
                                  {ratingForm.value} étoile
                                  {ratingForm.value > 1 ? "s" : ""}
                                </div>
                              </div>
                              <div className="comment-input">
                                <label>Commentaire (optionnel):</label>
                                <textarea
                                  value={ratingForm.comment}
                                  onChange={(e) =>
                                    setRatingForm({
                                      ...ratingForm,
                                      comment: e.target.value,
                                    })
                                  }
                                  placeholder="Votre avis sur cet événement..."
                                />
                              </div>
                              <div className="rating-actions">
                                <button
                                  type="button"
                                  onClick={() => setShowRatingForm(null)}
                                >
                                  Annuler
                                </button>
                                <button type="submit">Envoyer</button>
                              </div>
                            </form>
                          </div>
                        )}

                        {event.ratings && event.ratings.length > 0 && (
                          <div className="ratings-list">
                            <h5>Avis des participants:</h5>
                            {event.ratings.slice(0, 3).map((rating) => (
                              <div key={rating.id} className="rating-item">
                                <div className="rating-stars">
                                  {renderStars(rating.value)}
                                </div>
                                {rating.comment && (
                                  <p className="rating-comment">
                                    "{rating.comment}"
                                  </p>
                                )}
                                <small className="rating-date">
                                  {new Date(
                                    rating.created_at
                                  ).toLocaleDateString("fr-FR")}
                                </small>
                              </div>
                            ))}
                            {event.ratings.length > 3 && (
                              <p className="more-ratings">
                                +{event.ratings.length - 3} autres avis...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="workshops" className="workshops-section">
              <div className="container">
                <div className="section-header">
                  <div className="section-title">
                    <h2>Ateliers Créatifs</h2>
                    <p>Apprenez et créez avec nos artistes professionnels</p>
                  </div>
                  {userRole === 'Artist' && (
                    <button
                      className="add-button primary"
                      onClick={() => setShowWorkshopForm(!showWorkshopForm)}
                    >
                      {showWorkshopForm ? "Annuler" : "+ Ajouter un atelier"}
                    </button>
                  )}
                </div>

                {showWorkshopForm && (
                  <form className="add-form" onSubmit={handleWorkshopSubmit}>
                    <div className="form-group">
                      <label>Titre:</label>
                      <input
                        type="text"
                        value={workshopForm.title}
                        onChange={(e) =>
                          setWorkshopForm({
                            ...workshopForm,
                            title: e.target.value,
                          })
                        }
                        required
                      />
                      {workshopFormErrors.title && (
                        <div className="error-message">{workshopFormErrors.title}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Description:</label>
                      <textarea
                        value={workshopForm.description}
                        onChange={(e) =>
                          setWorkshopForm({
                            ...workshopForm,
                            description: e.target.value,
                          })
                        }
                        required
                      />
                      {workshopFormErrors.description && (
                        <div className="error-message">{workshopFormErrors.description}</div>
                      )}
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Date de début:</label>
                        <input
                          type="datetime-local"
                          value={workshopForm.start_date}
                          onChange={(e) =>
                            setWorkshopForm({
                              ...workshopForm,
                              start_date: e.target.value,
                            })
                          }
                          required
                        />
                        {workshopFormErrors.start_date && (
                          <div className="error-message">{workshopFormErrors.start_date}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Date de fin:</label>
                        <input
                          type="datetime-local"
                          value={workshopForm.end_date}
                          onChange={(e) =>
                            setWorkshopForm({
                              ...workshopForm,
                              end_date: e.target.value,
                            })
                          }
                          required
                        />
                        {workshopFormErrors.end_date && (
                          <div className="error-message">{workshopFormErrors.end_date}</div>
                        )}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Lieu:</label>
                        <input
                          type="text"
                          value={workshopForm.location}
                          onChange={(e) =>
                            setWorkshopForm({
                              ...workshopForm,
                              location: e.target.value,
                            })
                          }
                          required
                        />
                        {workshopFormErrors.location && (
                          <div className="error-message">{workshopFormErrors.location}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Capacité:</label>
                        <input
                          type="number"
                          value={workshopForm.capacity}
                          onChange={(e) =>
                            setWorkshopForm({
                              ...workshopForm,
                              capacity: parseInt(e.target.value),
                            })
                          }
                          required
                        />
                        {workshopFormErrors.capacity && (
                          <div className="error-message">{workshopFormErrors.capacity}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Prix (€):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={workshopForm.price}
                          onChange={(e) =>
                            setWorkshopForm({
                              ...workshopForm,
                              price: e.target.value,
                            })
                          }
                          required
                        />
                        {workshopFormErrors.price && (
                          <div className="error-message">{workshopFormErrors.price}</div>
                        )}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Niveau:</label>
                        <select
                          value={workshopForm.level}
                          onChange={(e) =>
                            setWorkshopForm({
                              ...workshopForm,
                              level: e.target.value,
                            })
                          }
                        >
                          <option value="beginner">Débutant</option>
                          <option value="intermediate">Intermédiaire</option>
                          <option value="advanced">Avancé</option>
                        </select>
                        {workshopFormErrors.level && (
                          <div className="error-message">{workshopFormErrors.level}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Durée:</label>
                        <input
                          type="text"
                          placeholder="ex: 2 heures"
                          value={workshopForm.duration}
                          onChange={(e) =>
                            setWorkshopForm({
                              ...workshopForm,
                              duration: e.target.value,
                            })
                          }
                          required
                        />
                        {workshopFormErrors.duration && (
                          <div className="error-message">{workshopFormErrors.duration}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Instructeur:</label>
                        <input
                          type="text"
                          value={workshopForm.instructor}
                          onChange={(e) =>
                            setWorkshopForm({
                              ...workshopForm,
                              instructor: e.target.value,
                            })
                          }
                          required
                        />
                        {workshopFormErrors.instructor && (
                          <div className="error-message">{workshopFormErrors.instructor}</div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Matériel fourni:</label>
                      <textarea
                        value={workshopForm.materials_provided}
                        onChange={(e) =>
                          setWorkshopForm({
                            ...workshopForm,
                            materials_provided: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Image:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setWorkshopForm({
                            ...workshopForm,
                            image: e.target.files ? e.target.files[0] : null,
                          })
                        }
                      />
                    </div>
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Sauvegarde en cours..."
                        : editingWorkshop
                        ? "Modifier l'atelier"
                        : "Ajouter l'atelier"}
                    </button>
                  </form>
                )}

                <div className="workshops-grid">
                  {workshops.map((workshop) => (
                    <div
                      key={workshop.id}
                      className="workshop-card"
                      onClick={(e) => {
                        // Empêcher l'ouverture du modal si on clique sur les boutons edit/delete
                        if ((e.target as HTMLElement).closest('.card-button')) {
                          return;
                        }
                        setShowWorkshopModal(workshop);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="card-image">
                        {workshop.image ? (
                          <img
                            src={`http://127.0.0.1:8000${workshop.image}`}
                            alt={workshop.title}
                          />
                        ) : (
                          <div className="image-placeholder">
                            <span>🎨</span>
                          </div>
                        )}
                        <div className="card-badge workshop">Atelier</div>
                      </div>
                      <div className="card-content">
                        <h3>{workshop.title}</h3>
                        <div className="card-details">
                          <div className="detail-item">
                            <span className="detail-icon">📍</span>
                            <span>{workshop.location}</span>
                          </div>
                        </div>
                        <div className="card-footer">
                          <span className="price">{workshop.price} €</span>
                        </div>
                        <div className="card-actions">
                          {userRole === 'Artist' && (
                            <>
                              <button
                                className="card-button edit"
                                onClick={() => handleEditWorkshop(workshop)}
                              >
                                ✏️
                              </button>
                              <button
                                className="card-button delete"
                                onClick={() => handleDeleteWorkshop(workshop.id)}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="oeuvres" className="oeuvres-section">
              <div className="container">
                <div className="section-header">
                  <div className="section-title">
                    <h2>Œuvres Disponibles</h2>
                    <p>Gérez les œuvres d'art disponibles à la réservation</p>
                  </div>
                </div>

                <div className="oeuvres-management">
                  <div className="management-section">
                    <div className="section-header">
                      <h3>Liste des Œuvres</h3>
                      {userRole === 'Artist' && (
                        <button
                          className="add-button secondary"
                          onClick={() => setShowArtworkForm({} as Artwork)}
                        >
                          + Ajouter une œuvre
                        </button>
                      )}
                    </div>

                    {showArtworkForm && (
                      <ArtworkCreate
                        artwork={
                          showArtworkForm.id ? showArtworkForm : undefined
                        }
                        onSave={handleArtworkSave}
                        onCancel={() => setShowArtworkForm(null)}
                      />
                    )}

                    <ArtworkList
                      ref={artworkListRef}
                      onReserve={(artwork) => setShowReservationForm(artwork)}
                      onEdit={handleArtworkEdit}
                      onDelete={handleArtworkDelete}
                      onAnalyzeColors={handleAnalyzeColors}
                      userRole={userRole}
                    />
                  </div>
                </div>

                {showReservationForm && (
                  <ReservationCreate
                    artwork={showReservationForm}
                    onSave={handleReservationSave}
                    onCancel={() => setShowReservationForm(null)}
                  />
                )}
              </div>
            </section>


            <section id="reservations" className="reservations-section">
              <div className="container">
                <div className="section-header">
                  <div className="section-title">
                    <h2>Liste des Réservations</h2>
                    <p>Gérez les réservations des œuvres d'art</p>
                  </div>
                </div>

                <div className="reservations-management">
                  <div className="management-section">
                    <div className="section-header">
                      <h3>Réservations</h3>
                    </div>

                    <ReservationList
                      ref={reservationListRef}
                      onStatusChange={handleReservationStatusChange}
                      onDelete={handleReservationDelete}
                      userRole={userRole}
                    />
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          // Message affiché quand l'utilisateur n'est pas connecté
          <section className="not-logged-section">
            <div className="container">
              <div className="not-logged-content">
                <h2>Bienvenue chez ArtFusion</h2>
                <p>
                  Veuillez vous connecter ou créer un compte pour accéder à
                  toutes les fonctionnalités de notre galerie d'art.
                </p>
                <div className="auth-options">
                  <button
                    onClick={() => setShowLoginForm(true)}
                    className="auth-button primary"
                  >
                    Se connecter
                  </button>
                  <button
                    onClick={() => setShowSignupForm(true)}
                    className="auth-button secondary"
                  >
                    Créer un compte
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Chatbot Component */}
        <Chatbot />

        {/* Color Analysis Modal */}
        {showColorModal && selectedArtwork && (
          <ColorAnalysisModal
            artwork={selectedArtwork}
            isOpen={showColorModal}
            onClose={() => {
              setShowColorModal(false);
              setSelectedArtwork(null);
            }}
            onAnalyze={handleColorAnalysis}
          />
        )}

        <section id="about" className="about-section">
          <div className="container">
            <div className="about-content">
              <h2>À Propos d'ArtFusion</h2>
              <p>
                ArtFusion est une galerie d'art contemporain dédiée à la
                promotion des artistes émergents et établis. Notre mission est
                de créer un espace où l'art rencontre le public, à travers des
                expositions uniques, des ateliers créatifs et des événements
                culturels enrichissants.
              </p>
              <div className="about-features">
                <div className="feature">
                  <span className="feature-icon">🎨</span>
                  <h3>Expositions Uniques</h3>
                  <p>
                    Découvrez des œuvres d'art exceptionnelles dans un cadre
                    intimiste
                  </p>
                </div>
                <div className="feature">
                  <span className="feature-icon">🎭</span>
                  <h3>Ateliers Créatifs</h3>
                  <p>
                    Apprenez de nouvelles techniques artistiques avec nos
                    experts
                  </p>
                </div>
                <div className="feature">
                  <span className="feature-icon">🤝</span>
                  <h3>Communauté</h3>
                  <p>Rejoignez une communauté passionnée d'art et de culture</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="login" className="login-section">
          <div className="container">
            {!isLoggedIn && (
              <>
                <div className="section-header">
                  <h2>Connexion</h2>
                  <button
                    className="add-button secondary"
                    onClick={() => setShowLoginForm(true)}
                  >
                    Se connecter
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Formulaires modaux */}
        {showLoginForm && (
          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setShowLoginForm(false)}
            onForgotPassword={() => {
              setShowLoginForm(false);
              setShowForgotPasswordForm(true);
            }}
          />
        )}

        {showSignupForm && (
          <SignupForm
            onSignupSuccess={handleSignupSuccess}
            onCancel={() => setShowSignupForm(false)}
          />
        )}

        {showForgotPasswordForm && (
          <ForgotPasswordForm
            onSuccess={handleForgotPasswordSuccess}
            onCancel={() => setShowForgotPasswordForm(false)}
          />
        )}

        {/* Modal de détails d'événement */}
        {showEventModal && (
          <div className="modal-overlay" onClick={() => setShowEventModal(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{showEventModal.title}</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowEventModal(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                {showEventModal.image && (
                  <div className="modal-image">
                    <img
                      src={`http://127.0.0.1:8000${showEventModal.image}`}
                      alt={showEventModal.title}
                    />
                  </div>
                )}
                <div className="modal-details">
                  <div className="detail-section">
                    <h3>Description</h3>
                    <p>{showEventModal.description}</p>
                  </div>
                  <div className="detail-section">
                    <h3>Informations pratiques</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <div>
                          <strong>Début:</strong>{" "}
                          {new Date(showEventModal.start_date).toLocaleString(
                            "fr-FR"
                          )}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <div>
                          <strong>Fin:</strong>{" "}
                          {new Date(showEventModal.end_date).toLocaleString(
                            "fr-FR"
                          )}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <div>
                          <strong>Lieu:</strong> {showEventModal.location}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">👥</span>
                        <div>
                          <strong>Capacité:</strong> {showEventModal.capacity} places
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">💰</span>
                        <div>
                          <strong>Prix:</strong> {showEventModal.price} €
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="detail-section">
                    <h3>Note moyenne</h3>
                    <div className="rating-display">
                      {renderStars(Math.round(showEventModal.average_rating))}
                      <span className="rating-score">
                        ({showEventModal.average_rating
                          ? showEventModal.average_rating.toFixed(1)
                          : "0.0"})
                      </span>
                    </div>
                  </div>
                  {showEventModal.ratings && showEventModal.ratings.length > 0 && (
                    <div className="detail-section">
                      <h3>Avis des participants</h3>
                      <div className="ratings-list">
                        {showEventModal.ratings.map((rating) => (
                          <div key={rating.id} className="rating-item">
                            <div className="rating-stars">
                              {renderStars(rating.value)}
                            </div>
                            {rating.comment && (
                              <p className="rating-comment">"{rating.comment}"</p>
                            )}
                            <small className="rating-date">
                              {new Date(rating.created_at).toLocaleDateString("fr-FR")}
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <div className="modal-actions">
                    <button
                      className="participate-button"
                      onClick={() => {
                        setShowEventModal(null);
                        setShowParticipationForm({type: 'event', id: showEventModal.id});
                      }}
                    >
                      🎨 Participer ({showEventModal.participants_count || 0} participants)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal du calendrier */}
        {showCalendarModal && (
          <div className="modal-overlay" onClick={() => setShowCalendarModal(false)}>
            <div className="modal-content calendar-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📅 Calendrier des Événements</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowCalendarModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="calendar-container">
                  <div className="calendar-header">
                    <button
                      className="calendar-nav-button"
                      onClick={() => navigateMonth('prev')}
                    >
                      ‹ Précédent
                    </button>
                    <h3 className="calendar-title">
                      {currentDate.toLocaleDateString('fr-FR', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </h3>
                    <button
                      className="calendar-nav-button"
                      onClick={() => navigateMonth('next')}
                    >
                      Suivant ›
                    </button>
                    <button
                      className="calendar-today-button"
                      onClick={goToToday}
                    >
                      Aujourd'hui
                    </button>
                  </div>

                  <div className="calendar-grid">
                    {/* En-têtes des jours */}
                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                      <div key={day} className="calendar-day-header">
                        {day}
                      </div>
                    ))}

                    {/* Jours du mois */}
                    {getDaysInMonth(currentDate).map((date, index) => {
                      if (!date) {
                        return <div key={index} className="calendar-day empty"></div>;
                      }

                      const dayEvents = getEventsForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

                      return (
                        <div
                          key={index}
                          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedDate(date)}
                        >
                          <div className="day-number">{date.getDate()}</div>
                          <div className="day-events">
                            {dayEvents.slice(0, 2).map((event, eventIndex) => (
                              <div
                                key={eventIndex}
                                className={`day-event ${'average_rating' in event ? 'event' : 'workshop'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCalendarModal(false); // Fermer le modal calendrier
                                  if ('average_rating' in event) {
                                    setShowEventModal(event as Event);
                                  } else {
                                    setShowWorkshopModal(event as Workshop);
                                  }
                                }}
                              >
                                <span className="event-title">{event.title}</span>
                                <span className="event-type">
                                  {'average_rating' in event ? 'Événement' : 'Atelier'}
                                </span>
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="more-events">
                                +{dayEvents.length - 2} autres
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedDate && (
                    <div className="selected-date-details">
                      <h4>
                        Événements du {selectedDate.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h4>
                      <div className="selected-date-events">
                        {getEventsForDate(selectedDate).map((event, index) => (
                          <div key={index} className="selected-event-item">
                            <div className="event-info">
                              <h5>{event.title}</h5>
                              <p className="event-description">{event.description.slice(0, 100)}...</p>
                              <div className="event-meta">
                                <span className={`event-badge ${'average_rating' in event ? 'event' : 'workshop'}`}>
                                  {'average_rating' in event ? 'Événement' : 'Atelier'}
                                </span>
                                <span>📍 {event.location}</span>
                                <span>⏰ {new Date(event.start_date).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              </div>
                            </div>
                            <button
                              className="view-details-button"
                              onClick={() => {
                                setShowCalendarModal(false); // Fermer le modal calendrier
                                if ('average_rating' in event) {
                                  setShowEventModal(event as Event);
                                } else {
                                  setShowWorkshopModal(event as Workshop);
                                }
                              }}
                            >
                              Voir détails
                            </button>
                          </div>
                        ))}
                        {getEventsForDate(selectedDate).length === 0 && (
                          <p className="no-events">Aucun événement prévu ce jour.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de participation */}
        {showParticipationForm && (
          <div className="modal-overlay" onClick={() => setShowParticipationForm(null)}>
            <div className="modal-content participation-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Participer à {showParticipationForm.type === 'event' ? "l'événement" : "l'atelier"}</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowParticipationForm(null)}
                >
                  ×
                </button>
              </div>
              <form className="participation-form" onSubmit={handleParticipationSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom:</label>
                    <input
                      type="text"
                      value={participationForm.first_name}
                      onChange={(e) =>
                        setParticipationForm({ ...participationForm, first_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom:</label>
                    <input
                      type="text"
                      value={participationForm.last_name}
                      onChange={(e) =>
                        setParticipationForm({ ...participationForm, last_name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={participationForm.email}
                    onChange={(e) =>
                      setParticipationForm({ ...participationForm, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone:</label>
                  <input
                    type="tel"
                    value={participationForm.phone}
                    onChange={(e) =>
                      setParticipationForm({ ...participationForm, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setShowParticipationForm(null)}
                    className="cancel-button"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="submit-participation-button"
                    disabled={submittingParticipation}
                  >
                    {submittingParticipation ? "Inscription en cours..." : "S'inscrire"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de détails d'atelier */}
        {showWorkshopModal && (
          <div className="modal-overlay" onClick={() => setShowWorkshopModal(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{showWorkshopModal.title}</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowWorkshopModal(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                {showWorkshopModal.image && (
                  <div className="modal-image">
                    <img
                      src={`http://127.0.0.1:8000${showWorkshopModal.image}`}
                      alt={showWorkshopModal.title}
                    />
                  </div>
                )}
                <div className="modal-details">
                  <div className="detail-section">
                    <h3>Description</h3>
                    <p>{showWorkshopModal.description}</p>
                  </div>
                  <div className="detail-section">
                    <h3>Informations pratiques</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <div>
                          <strong>Début:</strong>{" "}
                          {new Date(showWorkshopModal.start_date).toLocaleString(
                            "fr-FR"
                          )}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <div>
                          <strong>Fin:</strong>{" "}
                          {new Date(showWorkshopModal.end_date).toLocaleString(
                            "fr-FR"
                          )}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <div>
                          <strong>Lieu:</strong> {showWorkshopModal.location}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">👨‍🎨</span>
                        <div>
                          <strong>Instructeur:</strong> {showWorkshopModal.instructor}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📊</span>
                        <div>
                          <strong>Niveau:</strong> {showWorkshopModal.level}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">⏱️</span>
                        <div>
                          <strong>Durée:</strong> {showWorkshopModal.duration}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">👥</span>
                        <div>
                          <strong>Capacité:</strong> {showWorkshopModal.capacity} places
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">💰</span>
                        <div>
                          <strong>Prix:</strong> {showWorkshopModal.price} €
                        </div>
                      </div>
                    </div>
                  </div>
                  {showWorkshopModal.materials_provided && (
                    <div className="detail-section">
                      <h3>Matériel fourni</h3>
                      <p>{showWorkshopModal.materials_provided}</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <div className="modal-actions">
                    <button
                      className="participate-button"
                      onClick={() => {
                        setShowWorkshopModal(null);
                        setShowParticipationForm({type: 'workshop', id: showWorkshopModal.id});
                      }}
                    >
                      🎨 Participer ({showWorkshopModal.participants_count || 0} participants)
                    </button>
                    <button
                      className="summary-ai-button"
                      onClick={() => generateWorkshopSummary(showWorkshopModal)}
                      disabled={generatingSummary}
                    >
                      {generatingSummary ? "⏳ Génération..." : "🤖 SummaryAI"}
                    </button>
                  </div>
                  {workshopSummary && (
                    <div className="ai-summary">
                      <h4>✨ Résumé IA</h4>
                      <p>{workshopSummary}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="main-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>ArtFusion</h3>
              <p>Galerie d'Art Contemporain</p>
            </div>
            <div className="footer-links">
              <div className="footer-section">
                <h4>Navigation</h4>
                <ul>
                  {isLoggedIn ? (
                    // Liens du footer quand connecté
                    <>
                      <li>
                        <a href="#events">Événements</a>
                      </li>
                      <li>
                        <a href="#workshops">Ateliers</a>
                      </li>
                      <li>
                        <a href="#oeuvres">Oeuvre</a>
                      </li>
                      <li>
                        <a href="#reservations">Réservations</a>
                      </li>
                      <li>
                        <button
                          onClick={() => setShowCalendarModal(true)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "inherit",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          📅 Calendrier
                        </button>
                      </li>
                      <li>
                        <a href="#about">À propos</a>
                      </li>
                    </>
                  ) : (
                    // Liens du footer quand non connecté
                    <>
                      <li>
                        <a href="#about">À propos</a>
                      </li>
                      <li>
                        <button
                          onClick={() => setShowLoginForm(true)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "inherit",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Se connecter
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => setShowSignupForm(true)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "inherit",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Créer un Compte
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <div className="footer-section">
                <h4>Contact</h4>
                <ul>
                  <li>📧 contact@artfusion.com</li>
                  <li>📞 +216 XX XXX XXX</li>
                  <li>📍 Tunis, Tunisie</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 ArtFusion. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
