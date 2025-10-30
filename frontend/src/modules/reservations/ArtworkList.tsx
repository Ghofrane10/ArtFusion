import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Artwork } from './types';

interface ArtworkListProps {
  onReserve: (artwork: Artwork) => void;
  onEdit: (artwork: Artwork) => void;
  onDelete: (artworkId: number) => void;
  onAnalyzeColors?: (artwork: Artwork) => void;
}

export interface ArtworkListRef {
  refresh: () => void;
}

const ArtworkList = forwardRef<ArtworkListRef, ArtworkListProps>(({ onReserve, onEdit, onDelete, onAnalyzeColors }, ref) => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArtworks = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/artworks/');
      const data = await response.json();
      setArtworks(data);
    } catch (error) {
      console.error('Erreur lors du chargement des œuvres:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

  // Fonction pour rafraîchir les données
  const refreshArtworks = () => {
    fetchArtworks();
  };

  // Exposer la fonction de rafraîchissement via useImperativeHandle
  useImperativeHandle(ref, () => ({
    refresh: refreshArtworks
  }));

  if (loading) {
    return <div className="loading">Chargement des œuvres...</div>;
  }

  return (
    <div className="artworks-grid">
      {artworks.map(artwork => (
        <div key={artwork.id} className="artwork-card">
          <div className="card-image">
            {artwork.image ? (
              <img src={`http://127.0.0.1:8000${artwork.image}`} alt={artwork.title} />
            ) : (
              <div className="image-placeholder">
                <span>🎨</span>
              </div>
            )}
            <div className="card-badge">Œuvre</div>
          </div>
          <div className="card-content">
            <h3>{artwork.title}</h3>
            <p className="card-description">{artwork.description}</p>
            <div className="card-details">
              <div className="detail-item">
                <span className="detail-icon">📦</span>
                <span>{artwork.quantity_available} disponibles</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">💰</span>
                <span>{artwork.price} €</span>
              </div>
            </div>

            {/* Color Palette Display or Analyze Button */}
            {artwork.color_palette && artwork.color_palette.length > 0 ? (
              <div className="color-palette">
                <div className="palette-colors">
                  {artwork.color_palette.map((color, index) => (
                    <div
                      key={index}
                      className="color-swatch"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <span className="palette-label">Palette de couleurs</span>
              </div>
            ) : (
              /* Analyze Colors Button */
              <div className="color-analysis-section">
                <button
                  className="analyze-colors-button"
                  onClick={() => onAnalyzeColors && onAnalyzeColors(artwork)}
                  title="Analyser les couleurs dominantes de l'œuvre"
                >
                  🎨 Analyser les Couleurs
                </button>
              </div>
            )}
            <div className="card-footer">
              <div className="card-actions">
                <button
                  className="card-button reserve"
                  onClick={() => onReserve(artwork)}
                  disabled={artwork.quantity_available === 0}
                >
                  📝 Réserver
                </button>
                <button className="card-button edit" onClick={() => onEdit(artwork)}>✏️</button>
                <button className="card-button delete" onClick={() => onDelete(artwork.id)}>🗑️</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

ArtworkList.displayName = 'ArtworkList';

export default ArtworkList;