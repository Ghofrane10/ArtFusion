import React, { useState, useEffect } from 'react';
import { Comment } from './types';

interface CommentSectionProps {
  artworkId: number;
  userRole?: string;
  isAuthenticated?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  artworkId,
  userRole,
  isAuthenticated = false
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/artworks/${artworkId}/comments/`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      } else {
        setError('Erreur lors du chargement des commentaires');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  useEffect(() => {
    fetchComments();
  }, [artworkId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      // Moderation check with backend (Groq)
      const token = localStorage.getItem('access_token');
      const modRes = await fetch('http://127.0.0.1:8000/api/ai/moderate-comment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: newComment }),
      });
      if (modRes.ok) {
        const modJson = await modRes.json();
        if (modJson && modJson.allowed === false) {
          setError(modJson.reason || 'Votre commentaire contient un contenu inapproprié.');
          return;
        }
      }

      const response = await fetch(`http://127.0.0.1:8000/api/artworks/${artworkId}/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        await fetchComments();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || errorData.error || errorData.content || 'Erreur lors de l\'ajout du commentaire');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Moderation check
      const token = localStorage.getItem('access_token');
      const modRes = await fetch('http://127.0.0.1:8000/api/ai/moderate-comment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: editContent }),
      });
      if (modRes.ok) {
        const modJson = await modRes.json();
        if (modJson && modJson.allowed === false) {
          setError(modJson.reason || 'Votre commentaire contient un contenu inapproprié.');
          return;
        }
      }

      const response = await fetch(`http://127.0.0.1:8000/api/comments/${commentId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        setEditingComment(null);
        setEditContent('');
        await fetchComments();
      } else {
        setError('Erreur lors de la modification du commentaire');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/comments/${commentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchComments();
      } else {
        setError('Erreur lors de la suppression du commentaire');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
  };

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">Commentaires</h3>

      {error && <div className="error-message">{error}</div>}

      {/* Liste des commentaires */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">Aucun commentaire pour le moment. Soyez le premier à commenter !</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <strong>{comment.user.first_name} {comment.user.last_name}</strong>
                  {comment.user.category === 'Artist' && (
                    <span className="artist-badge">Artiste</span>
                  )}
                </div>
                <div className="comment-date">
                  {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {editingComment === comment.id ? (
                <div className="comment-edit">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="comment-input"
                    rows={3}
                  />
                  <div className="comment-actions">
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      disabled={loading}
                      className="btn-save"
                    >
                      Sauvegarder
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={loading}
                      className="btn-cancel"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="comment-content">
                  <p>{comment.content}</p>
                  {isAuthenticated && comment.user.id === parseInt(localStorage.getItem('user_id') || '0') && userRole === 'Visiteur' && (
                    <div className="comment-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button
                        onClick={() => startEditing(comment)}
                        disabled={loading}
                        className="btn-edit"
                        title="Modifier ce commentaire"
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={loading}
                        className="btn-delete"
                        title="Supprimer ce commentaire"
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Formulaire d'ajout de commentaire */}
      {isAuthenticated && userRole === 'Visiteur' ? (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <div className="form-group">
            <label htmlFor="new-comment">Ajouter un commentaire :</label>
            <textarea
              id="new-comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Partagez votre avis sur cette œuvre..."
              className="comment-input"
              rows={4}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="btn-submit"
          >
            {loading ? 'Publication...' : 'Publier le commentaire'}
          </button>
        </form>
      ) : isAuthenticated && userRole === 'Artist' ? (
        <div className="artist-message">
          <p>En tant qu'artiste, vous ne pouvez pas commenter les œuvres. Concentrez-vous sur la création ! 🎨</p>
        </div>
      ) : (
        <div className="login-prompt">
          <p>Connectez-vous pour laisser un commentaire.</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;