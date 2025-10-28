import React, { useState } from 'react';
import { Artwork } from './types';

interface ArtworkCreateProps {
  artwork?: Artwork;
  onSave: (artwork: Omit<Artwork, 'id' | 'created_at' | 'image'> & { image: File | null }) => void;
  onCancel: () => void;
}

const ArtworkCreate: React.FC<ArtworkCreateProps> = ({ artwork, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: artwork?.title || '',
    description: artwork?.description || '',
    quantity_available: artwork?.quantity_available || 1,
    price: artwork?.price ? parseFloat(artwork.price).toString() : '0.00',
    image: null as File | null
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const dataToSend = {
      ...formData,
      price: parseFloat(formData.price).toFixed(2)
    };

    onSave(dataToSend);
    setSubmitting(false);
  };

  return (
    <div className="reservation-form-overlay">
      <div className="reservation-form-container">
        <h3>{artwork ? `Modifier: ${artwork.title}` : 'Ajouter une nouvelle œuvre'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Titre:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Quantité disponible:</label>
            <input
              type="number"
              min="1"
              value={formData.quantity_available}
              onChange={(e) => setFormData({...formData, quantity_available: parseInt(e.target.value) || 1})}
              required
            />
          </div>
          <div className="form-group">
            <label>Prix (€):</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({...formData, image: e.target.files ? e.target.files[0] : null})}
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel}>Annuler</button>
            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? 'Sauvegarde en cours...' : (artwork ? 'Modifier l\'œuvre' : 'Ajouter l\'œuvre')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtworkCreate;