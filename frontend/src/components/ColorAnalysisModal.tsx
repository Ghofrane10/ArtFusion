import React, { useState } from 'react';
import { Artwork } from '../modules/reservations/types';
import './ColorAnalysisModal.css';

interface ColorAnalysisModalProps {
  artwork: Artwork;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (artworkId: number) => Promise<string[]>;
}

const ColorAnalysisModal: React.FC<ColorAnalysisModalProps> = ({
  artwork,
  isOpen,
  onClose,
  onAnalyze
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedColors, setAnalyzedColors] = useState<string[] | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    console.log('Starting color analysis for artwork:', artwork.title);
    try {
      const colors = await onAnalyze(artwork.id);
      console.log('Colors received from API:', colors);
      setAnalyzedColors(colors);
      console.log('Colors set in state:', colors);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Analyse des Couleurs - {artwork.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="artwork-preview">
            <img
              src={`http://127.0.0.1:8000${artwork.image}`}
              alt={artwork.title}
              className="artwork-image"
            />
            <div className="artwork-info">
              <h3>{artwork.title}</h3>
              <p>{artwork.description}</p>
            </div>
          </div>

          {!analyzedColors && !isAnalyzing && (
            <div className="analysis-prompt">
              <div className="analysis-icon">🎨</div>
              <h3>Analyser les couleurs dominantes</h3>
              <p>
                Cliquez sur le bouton ci-dessous pour analyser automatiquement
                les couleurs principales de cette œuvre d'art.
              </p>
              <button
                className="analyze-button"
                onClick={handleAnalyze}
              >
                🚀 Lancer l'Analyse
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div className="analyzing-state">
              <div className="loading-spinner"></div>
              <h3>Analyse en cours...</h3>
              <p>Extraction des couleurs dominantes de l'image</p>
            </div>
          )}

          {analyzedColors && !isAnalyzing && (
            <div className="analysis-results">
              <h3>🎨 Couleurs Dominantes Extraites</h3>
              <div className="color-palette-large">
                {analyzedColors.map((color, index) => (
                  <div key={index} className="color-item">
                    <div
                      className="color-swatch-large"
                      style={{ backgroundColor: color }}
                    />
                    <div className="color-info">
                      <span className="color-hex">{color}</span>
                      <span className="color-name">Couleur {index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="debug-info" style={{ marginTop: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '8px', fontSize: '12px' }}>
                <strong>Debug:</strong> Colors received: {JSON.stringify(analyzedColors)}
              </div>

              <div className="analysis-info">
                <p>
                  <strong>Comment ça marche ?</strong><br />
                  L'algorithme analyse l'image en utilisant le clustering K-means
                  pour identifier les 5 couleurs les plus représentatives de l'œuvre.
                </p>
              </div>

              <div className="modal-actions">
                <button className="save-button" onClick={onClose}>
                  Fermer et Sauvegarder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColorAnalysisModal;