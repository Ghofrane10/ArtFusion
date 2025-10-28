import React, { useState } from 'react';
import { Artwork } from './types';

interface ReservationCreateProps {
  artwork: Artwork;
  onSave: (reservation: {
    artwork_id: number;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    quantity: number;
    notes?: string;
  }) => void;
  onCancel: () => void;
}

const ReservationCreate: React.FC<ReservationCreateProps> = ({ artwork, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    quantity: 1,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const dataToSend = {
      artwork_id: artwork.id,
      ...formData
    };

    onSave(dataToSend);
    setSubmitting(false);
  };

  return (
    <div className="reservation-form-overlay">
      <div className="reservation-form-container">
        <h3>Réserver: {artwork.title}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom complet:</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Téléphone:</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Adresse:</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Quantité:</label>
            <input
              type="number"
              min="1"
              max={artwork.quantity_available}
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
              required
            />
            <small>Disponible: {artwork.quantity_available}</small>
          </div>
          <div className="form-group">
            <label>Notes (optionnel):</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Informations supplémentaires..."
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel}>Annuler</button>
            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? 'Réservation en cours...' : 'Réserver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationCreate;