import { useState, useEffect } from 'react';
import './App.css';

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
}

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showWorkshopForm, setShowWorkshopForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // États pour les formulaires
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    capacity: 0,
    price: '0.00',
    image: null as File | null
  });

  const [workshopForm, setWorkshopForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    capacity: 0,
    price: '0.00',
    level: 'beginner',
    duration: '',
    materials_provided: '',
    instructor: '',
    image: null as File | null
  });

  // États pour l'édition
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [showRatingForm, setShowRatingForm] = useState<number | null>(null);
  const [ratingForm, setRatingForm] = useState({
    value: 5,
    comment: ''
  });
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    fetchEvents();
    fetchWorkshops();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/events/');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    }
  };

  const fetchWorkshops = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/workshops/');
      const data = await response.json();
      setWorkshops(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des ateliers:', error);
      setLoading(false);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', eventForm.title);
      formData.append('description', eventForm.description);
      formData.append('start_date', eventForm.start_date);
      formData.append('end_date', eventForm.end_date);
      formData.append('location', eventForm.location);
      formData.append('capacity', eventForm.capacity.toString());
      formData.append('price', eventForm.price);
      if (eventForm.image) {
        formData.append('image', eventForm.image);
      }

      const url = editingEvent
        ? `http://127.0.0.1:8000/api/events/${editingEvent.id}/`
        : 'http://127.0.0.1:8000/api/events/';

      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      if (response.ok) {
        await fetchEvents();
        setShowEventForm(false);
        setEditingEvent(null);
        setEventForm({
          title: '',
          description: '',
          start_date: '',
          end_date: '',
          location: '',
          capacity: 0,
          price: '0.00',
          image: null
        });
      } else {
        console.error('Erreur lors de la sauvegarde de l\'événement');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
    setSubmitting(false);
  };

  const handleWorkshopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', workshopForm.title);
      formData.append('description', workshopForm.description);
      formData.append('start_date', workshopForm.start_date);
      formData.append('end_date', workshopForm.end_date);
      formData.append('location', workshopForm.location);
      formData.append('capacity', workshopForm.capacity.toString());
      formData.append('price', workshopForm.price);
      formData.append('level', workshopForm.level);
      formData.append('duration', workshopForm.duration);
      formData.append('materials_provided', workshopForm.materials_provided);
      formData.append('instructor', workshopForm.instructor);
      if (workshopForm.image) {
        formData.append('image', workshopForm.image);
      }

      const url = editingWorkshop
        ? `http://127.0.0.1:8000/api/workshops/${editingWorkshop.id}/`
        : 'http://127.0.0.1:8000/api/workshops/';

      const method = editingWorkshop ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      if (response.ok) {
        await fetchWorkshops();
        setShowWorkshopForm(false);
        setEditingWorkshop(null);
        setWorkshopForm({
          title: '',
          description: '',
          start_date: '',
          end_date: '',
          location: '',
          capacity: 0,
          price: '0.00',
          level: 'beginner',
          duration: '',
          materials_provided: '',
          instructor: '',
          image: null
        });
      } else {
        console.error('Erreur lors de la sauvegarde de l\'atelier');
      }
    } catch (error) {
      console.error('Erreur:', error);
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
      image: null
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
      image: null
    });
    setShowWorkshopForm(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/events/${eventId}/`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchEvents();
        } else {
          console.error('Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleDeleteWorkshop = async (workshopId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet atelier ?')) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/workshops/${workshopId}/`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchWorkshops();
        } else {
          console.error('Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleRatingSubmit = async (eventId: number, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/events/${eventId}/ratings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ratingForm),
      });

      if (response.ok) {
        await fetchEvents();
        setShowRatingForm(null);
        setRatingForm({ value: 5, comment: '' });
      } else {
        console.error('Erreur lors de l\'ajout du rating');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'star filled' : 'star'}>
        ★
      </span>
    ));
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="app">
      <header className="main-header">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>ArtFusion</h1>
            <span className="tagline">Galerie d'Art Contemporain</span>
          </div>
          <ul className="nav-menu">
            <li><a href="#events" className="nav-link">Événements</a></li>
            <li><a href="#workshops" className="nav-link">Ateliers</a></li>
            <li><a href="#about" className="nav-link">À propos</a></li>
          </ul>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h2>Découvrez l'Art Vivant</h2>
          <p>Explorez nos expositions, vernissages et ateliers artistiques uniques</p>
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
        <div className="hero-image">
          <div className="hero-placeholder">
            <span>🎨</span>
          </div>
        </div>
      </section>

      <main>
        <section id="events" className="events-section">
          <div className="container">
            <div className="section-header">
              <div className="section-title">
                <h2>Événements à Venir</h2>
                <p>Découvrez nos expositions et vernissages exclusifs</p>
              </div>
              <button
                className="add-button primary"
                onClick={() => setShowEventForm(!showEventForm)}
              >
                {showEventForm ? 'Annuler' : '+ Ajouter un événement'}
              </button>
            </div>

          {showEventForm && (
            <form className="add-form" onSubmit={handleEventSubmit}>
              <div className="form-group">
                <label>Titre:</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date de début:</label>
                  <input
                    type="datetime-local"
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm({...eventForm, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date de fin:</label>
                  <input
                    type="datetime-local"
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm({...eventForm, end_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Lieu:</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Capacité:</label>
                  <input
                    type="number"
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({...eventForm, capacity: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Prix (€):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={eventForm.price}
                    onChange={(e) => setEventForm({...eventForm, price: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEventForm({...eventForm, image: e.target.files ? e.target.files[0] : null})}
                />
              </div>
              <button type="submit" className="submit-button" disabled={submitting}>
                {submitting ? 'Sauvegarde en cours...' : (editingEvent ? 'Modifier l\'événement' : 'Ajouter l\'événement')}
              </button>
            </form>
          )}

            <div className="events-grid">
              {events.map(event => (
                <div key={event.id} className="event-card">
                  <div className="card-image">
                    {event.image ? (
                      <img src={`http://127.0.0.1:8000${event.image}`} alt={event.title} />
                    ) : (
                      <div className="image-placeholder">
                        <span>🎨</span>
                      </div>
                    )}
                    <div className="card-badge">Événement</div>
                  </div>
                  <div className="card-content">
                    <h3>{event.title}</h3>
                    <p className="card-description">{event.description}</p>
                    <div className="card-details">
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <span>{new Date(event.start_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <span>{event.location}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">👥</span>
                        <span>{event.capacity} places</span>
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="rating-section">
                        <div className="rating-display">
                          {renderStars(Math.round(event.average_rating))}
                          <span className="rating-score">({event.average_rating.toFixed(1)})</span>
                        </div>
                        <button
                          className="rate-button"
                          onClick={() => setShowRatingForm(showRatingForm === event.id ? null : event.id)}
                        >
                          ⭐ Noter
                        </button>
                      </div>
                      <div className="card-actions">
                        <button className="card-button edit" onClick={() => handleEditEvent(event)}>✏️</button>
                        <button className="card-button delete" onClick={() => handleDeleteEvent(event.id)}>🗑️</button>
                      </div>
                    </div>

                    {showRatingForm === event.id && (
                      <div className="rating-form-overlay">
                        <form className="rating-form" onSubmit={(e) => handleRatingSubmit(event.id, e)}>
                          <h4>Noter cet événement</h4>
                          <div className="rating-input">
                            <label>Note:</label>
                            <div className="star-rating">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  className={`star-button ${star <= (hoveredRating || ratingForm.value) ? 'active' : ''}`}
                                  onClick={() => setRatingForm({...ratingForm, value: star})}
                                  onMouseEnter={() => setHoveredRating(star)}
                                  onMouseLeave={() => setHoveredRating(0)}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            <div className="rating-value-display">
                              {ratingForm.value} étoile{ratingForm.value > 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="comment-input">
                            <label>Commentaire (optionnel):</label>
                            <textarea
                              value={ratingForm.comment}
                              onChange={(e) => setRatingForm({...ratingForm, comment: e.target.value})}
                              placeholder="Votre avis sur cet événement..."
                            />
                          </div>
                          <div className="rating-actions">
                            <button type="button" onClick={() => setShowRatingForm(null)}>Annuler</button>
                            <button type="submit">Envoyer</button>
                          </div>
                        </form>
                      </div>
                    )}

                    {event.ratings && event.ratings.length > 0 && (
                      <div className="ratings-list">
                        <h5>Avis des participants:</h5>
                        {event.ratings.slice(0, 3).map(rating => (
                          <div key={rating.id} className="rating-item">
                            <div className="rating-stars">
                              {renderStars(rating.value)}
                            </div>
                            {rating.comment && (
                              <p className="rating-comment">"{rating.comment}"</p>
                            )}
                            <small className="rating-date">
                              {new Date(rating.created_at).toLocaleDateString('fr-FR')}
                            </small>
                          </div>
                        ))}
                        {event.ratings.length > 3 && (
                          <p className="more-ratings">+{event.ratings.length - 3} autres avis...</p>
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
              <button
                className="add-button primary"
                onClick={() => setShowWorkshopForm(!showWorkshopForm)}
              >
                {showWorkshopForm ? 'Annuler' : '+ Ajouter un atelier'}
              </button>
            </div>

          {showWorkshopForm && (
            <form className="add-form" onSubmit={handleWorkshopSubmit}>
              <div className="form-group">
                <label>Titre:</label>
                <input
                  type="text"
                  value={workshopForm.title}
                  onChange={(e) => setWorkshopForm({...workshopForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={workshopForm.description}
                  onChange={(e) => setWorkshopForm({...workshopForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date de début:</label>
                  <input
                    type="datetime-local"
                    value={workshopForm.start_date}
                    onChange={(e) => setWorkshopForm({...workshopForm, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date de fin:</label>
                  <input
                    type="datetime-local"
                    value={workshopForm.end_date}
                    onChange={(e) => setWorkshopForm({...workshopForm, end_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Lieu:</label>
                  <input
                    type="text"
                    value={workshopForm.location}
                    onChange={(e) => setWorkshopForm({...workshopForm, location: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Capacité:</label>
                  <input
                    type="number"
                    value={workshopForm.capacity}
                    onChange={(e) => setWorkshopForm({...workshopForm, capacity: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Prix (€):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={workshopForm.price}
                    onChange={(e) => setWorkshopForm({...workshopForm, price: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Niveau:</label>
                  <select
                    value={workshopForm.level}
                    onChange={(e) => setWorkshopForm({...workshopForm, level: e.target.value})}
                  >
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Durée:</label>
                  <input
                    type="text"
                    placeholder="ex: 2 heures"
                    value={workshopForm.duration}
                    onChange={(e) => setWorkshopForm({...workshopForm, duration: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Instructeur:</label>
                  <input
                    type="text"
                    value={workshopForm.instructor}
                    onChange={(e) => setWorkshopForm({...workshopForm, instructor: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Matériel fourni:</label>
                <textarea
                  value={workshopForm.materials_provided}
                  onChange={(e) => setWorkshopForm({...workshopForm, materials_provided: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setWorkshopForm({...workshopForm, image: e.target.files ? e.target.files[0] : null})}
                />
              </div>
              <button type="submit" className="submit-button" disabled={submitting}>
                {submitting ? 'Sauvegarde en cours...' : (editingWorkshop ? 'Modifier l\'atelier' : 'Ajouter l\'atelier')}
              </button>
            </form>
          )}

            <div className="workshops-grid">
              {workshops.map(workshop => (
                <div key={workshop.id} className="workshop-card">
                  <div className="card-image">
                    {workshop.image ? (
                      <img src={`http://127.0.0.1:8000${workshop.image}`} alt={workshop.title} />
                    ) : (
                      <div className="image-placeholder">
                        <span>🎨</span>
                      </div>
                    )}
                    <div className="card-badge workshop">Atelier</div>
                  </div>
                  <div className="card-content">
                    <h3>{workshop.title}</h3>
                    <p className="card-description">{workshop.description}</p>
                    <div className="card-details">
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <span>{new Date(workshop.start_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <span>{workshop.location}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">👨‍🎨</span>
                        <span>{workshop.instructor}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📊</span>
                        <span>Niveau {workshop.level}</span>
                      </div>
                    </div>
                    <div className="card-footer">
                      <span className="price">{workshop.price} €</span>
                      <div className="card-actions">
                        <button className="card-button edit" onClick={() => handleEditWorkshop(workshop)}>✏️</button>
                        <button className="card-button delete" onClick={() => handleDeleteWorkshop(workshop.id)}>🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="about-section">
          <div className="container">
            <div className="about-content">
              <h2>À Propos d'ArtFusion</h2>
              <p>ArtFusion est une galerie d'art contemporain dédiée à la promotion des artistes émergents et établis. Notre mission est de créer un espace où l'art rencontre le public, à travers des expositions uniques, des ateliers créatifs et des événements culturels enrichissants.</p>
              <div className="about-features">
                <div className="feature">
                  <span className="feature-icon">🎨</span>
                  <h3>Expositions Uniques</h3>
                  <p>Découvrez des œuvres d'art exceptionnelles dans un cadre intimiste</p>
                </div>
                <div className="feature">
                  <span className="feature-icon">🎭</span>
                  <h3>Ateliers Créatifs</h3>
                  <p>Apprenez de nouvelles techniques artistiques avec nos experts</p>
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
                  <li><a href="#events">Événements</a></li>
                  <li><a href="#workshops">Ateliers</a></li>
                  <li><a href="#about">À propos</a></li>
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