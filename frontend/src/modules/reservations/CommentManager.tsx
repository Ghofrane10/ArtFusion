import React, { useState, useEffect } from 'react';
import { Artwork, Comment } from './types';

interface CommentManagerProps {
  userRole?: string;
  isAuthenticated?: boolean;
}

const CommentManager: React.FC<CommentManagerProps> = ({
  userRole,
  isAuthenticated = false
}) => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArtworks = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/artworks/');
      if (response.ok) {
        const data = await response.json();
        setArtworks(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des œuvres');
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/comments/', {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des commentaires');
    }
  };

  useEffect(() => {
    fetchArtworks();
    fetchComments();
  }, []);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedArtwork || !isAuthenticated || userRole !== 'Visiteur') return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      // Moderation check
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

      const response = await fetch(`http://127.0.0.1:8000/api/artworks/${selectedArtwork}/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        setSelectedArtwork(null);
        await fetchComments();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || errorData.error || 'Erreur lors de l\'ajout du commentaire');
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
      const token = localStorage.getItem('access_token');
      // Moderation check
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

  const getArtworkTitle = (artworkId: number) => {
    const artwork = artworks.find(a => a.id === artworkId);
    return artwork ? artwork.title : 'Œuvre inconnue';
  };

  return (
    <div className="comment-manager">
      <h2 className="comment-manager-title">💬 Gestion des Commentaires</h2>

      {error && <div className="error-message" style={{
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
        border: '1px solid #f5c6cb'
      }}>{error}</div>}

      <div className="comment-manager-content">
        {/* Formulaire d'ajout de commentaire */}
        {isAuthenticated && userRole === 'Visiteur' && (
          <div className="add-comment-section">
            <h3>➕ Ajouter un commentaire</h3>
            <form onSubmit={handleSubmitComment} className="comment-form">
              <div className="form-group">
                <label htmlFor="artwork-select">Choisir une œuvre :</label>
                <select
                  id="artwork-select"
                  value={selectedArtwork || ''}
                  onChange={(e) => setSelectedArtwork(Number(e.target.value) || null)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    marginBottom: '15px'
                  }}
                >
                  <option value="">Sélectionnez une œuvre...</option>
                  {artworks.map(artwork => (
                    <option key={artwork.id} value={artwork.id}>
                      {artwork.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="new-comment">Votre commentaire :</label>
                <textarea
                  id="new-comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Partagez votre avis sur cette œuvre..."
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !newComment.trim() || !selectedArtwork}
                style={{
                  background: 'linear-gradient(135deg, #3498db, #2980b9)',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {loading ? 'Publication...' : '📝 Publier le commentaire'}
              </button>
            </form>
          </div>
        )}

        {isAuthenticated && userRole === 'Artist' && (
          <div className="artist-message" style={{
            textAlign: 'center',
            padding: '25px',
            background: 'linear-gradient(135deg, #e8f5e8, #f1f8e9)',
            border: '2px solid #4caf50',
            borderRadius: '10px',
            color: '#2e7d32'
          }}>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem' }}>
              🎨 En tant qu'artiste, vous ne pouvez pas commenter les œuvres. Concentrez-vous sur la création !
            </p>
          </div>
        )}

        {!isAuthenticated && (
          <div className="login-prompt" style={{
            textAlign: 'center',
            padding: '25px',
            background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
            border: '2px solid #f1c40f',
            borderRadius: '10px',
            color: '#8b4513'
          }}>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem' }}>
              🔒 Connectez-vous pour laisser un commentaire.
            </p>
          </div>
        )}

        {/* Liste des commentaires */}
        <div className="comments-section">
          <h3>📋 Tous les commentaires</h3>
          {comments.length === 0 ? (
            <p style={{
              textAlign: 'center',
              color: '#666',
              fontStyle: 'italic',
              padding: '20px'
            }}>
              Aucun commentaire pour le moment.
            </p>
          ) : (
            <div className="comments-list" style={{ marginTop: '20px' }}>
              {comments.map(comment => (
                <div key={comment.id} style={{
                  background: 'white',
                  border: '1px solid #e1e8ed',
                  borderRadius: '10px',
                  padding: '20px',
                  marginBottom: '15px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ color: '#2c3e50' }}>
                        {comment.user.first_name} {comment.user.last_name}
                      </strong>
                      {comment.user.category === 'Artist' && (
                        <span style={{
                          background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '15px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Artiste
                        </span>
                      )}
                    </div>
                    <div style={{
                      color: '#7f8c8d',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      🕒 {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div style={{
                    marginBottom: '10px',
                    fontSize: '0.9rem',
                    color: '#666'
                  }}>
                    <strong>Œuvre :</strong> {getArtworkTitle(comment.artwork)}
                  </div>

                  {editingComment === comment.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontFamily: 'inherit',
                          fontSize: '1rem',
                          resize: 'vertical',
                          minHeight: '80px'
                        }}
                        rows={3}
                      />
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          disabled={loading}
                          style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                          }}
                        >
                          💾 Sauvegarder
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={loading}
                          style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #95a5a6, #7f8c8d)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                          }}
                        >
                          ❌ Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{
                        margin: '0 0 15px 0',
                        lineHeight: '1.6',
                        color: '#34495e',
                        fontSize: '1rem'
                      }}>
                        {comment.content}
                      </p>

                      {isAuthenticated && comment.user.id === parseInt(localStorage.getItem('user_id') || '0') && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => startEditing(comment)}
                            disabled={loading}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
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
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentManager;