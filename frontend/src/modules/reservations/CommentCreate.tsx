import { useState, useEffect } from 'react';
import { Artwork, Comment } from './types';

interface CommentCreateProps {
  comment?: Comment;
  onSave: (commentData: {
    content: string;
    artwork: number;
    sentiment: 'satisfied' | 'not_satisfied' | 'neutral';
  }) => void;
  onCancel: () => void;
}

export function CommentCreate({ comment, onSave, onCancel }: CommentCreateProps) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [formData, setFormData] = useState({
    content: comment?.content || '',
    artwork: comment?.artwork.id || 0,
    sentiment: comment?.sentiment || 'neutral' as 'satisfied' | 'not_satisfied' | 'neutral'
  });
  const [loading, setLoading] = useState(false);
  const [moderationMessage, setModerationMessage] = useState<string>('');
  const [isContentAppropriate, setIsContentAppropriate] = useState<boolean | null>(null);
  const [checkingModeration, setCheckingModeration] = useState(false);

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/artworks/');
      const data = await response.json();
      setArtworks(data);
    } catch (error) {
      console.error('Erreur lors du chargement des œuvres:', error);
    }
  };

  const checkModeration = async (content: string) => {
    if (!content.trim()) return;

    setCheckingModeration(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/comments/check-moderation/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const result = await response.json();
      console.log('Moderation result:', result);

      if (result.status === 'approved') {
        setModerationMessage(`✅ ${result.message || 'Contenu approprié'}`);
        setIsContentAppropriate(true);
      } else if (result.status === 'rejected') {
        setModerationMessage(`❌ ${result.message || 'Contenu rejeté'}`);
        setIsContentAppropriate(false);
      } else {
        setModerationMessage(`⚠️ ${result.message || 'Erreur de modération'}`);
        setIsContentAppropriate(null);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de modération:', error);
      setModerationMessage('⚠️ Erreur lors de la vérification');
      setIsContentAppropriate(null);
    } finally {
      setCheckingModeration(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setFormData({...formData, content: newContent});

    // Vérifier la modération après un court délai
    if (newContent.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        checkModeration(newContent);
      }, 1000); // Attendre 1 seconde après que l'utilisateur ait arrêté d'écrire

      return () => clearTimeout(timeoutId);
    } else {
      setModerationMessage('');
      setIsContentAppropriate(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifier la modération avant de sauvegarder
    if (isContentAppropriate === false) {
      alert('Votre commentaire contient du contenu inapproprié. Veuillez le modifier avant de publier.');
      return;
    }

    if (isContentAppropriate === null && formData.content.trim().length > 10) {
      alert('Vérification de modération en cours. Veuillez patienter.');
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-create-form">
      <h3>{comment ? 'Modifier le commentaire' : 'Ajouter un commentaire'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Œuvre:</label>
          <select
            value={formData.artwork}
            onChange={(e) => setFormData({...formData, artwork: parseInt(e.target.value)})}
            required
          >
            <option value={0}>Sélectionner une œuvre</option>
            {artworks.map(artwork => (
              <option key={artwork.id} value={artwork.id}>
                {artwork.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Sentiment:</label>
          <select
            value={formData.sentiment}
            onChange={(e) => setFormData({...formData, sentiment: e.target.value as 'satisfied' | 'not_satisfied' | 'neutral'})}
          >
            <option value="satisfied">Satisfait</option>
            <option value="not_satisfied">Non satisfait</option>
            <option value="neutral">Neutre</option>
          </select>
        </div>

        <div className="form-group">
          <label>Contenu du commentaire:</label>
          <textarea
            value={formData.content}
            onChange={handleContentChange}
            placeholder="Votre commentaire..."
            required
            rows={4}
          />
          {checkingModeration && (
            <div className="moderation-checking">
              <small>🔍 Vérification en cours...</small>
            </div>
          )}
          {moderationMessage && (
            <div className={`moderation-message ${isContentAppropriate === false ? 'error' : isContentAppropriate === true ? 'success' : 'warning'}`}>
              <small>{moderationMessage}</small>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-button">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Sauvegarde...' : (comment ? 'Modifier' : 'Ajouter')}
          </button>
        </div>
      </form>
    </div>
  );
}