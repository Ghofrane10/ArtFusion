import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Comment } from './types';

export interface CommentListRef {
  refresh: () => void;
}

interface CommentListProps {
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: number) => void;
}

export const CommentList = forwardRef<CommentListRef, CommentListProps>(
  ({ onEdit, onDelete }, ref) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/comments/');
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchComments();
    }, []);

    useImperativeHandle(ref, () => ({
      refresh: fetchComments
    }));


    const getSentimentLabel = (sentiment: string) => {
      switch (sentiment) {
        case 'satisfied': return 'Satisfait';
        case 'not_satisfied': return 'Non satisfait';
        case 'neutral': return 'Neutre';
        default: return sentiment;
      }
    };

    const getSentimentColor = (sentiment: string) => {
      switch (sentiment) {
        case 'satisfied': return '#4CAF50';
        case 'not_satisfied': return '#f44336';
        case 'neutral': return '#ff9800';
        default: return '#666';
      }
    };

    const getModerationColor = (status: string) => {
      switch (status) {
        case 'approved': return '#4CAF50';
        case 'pending': return '#ff9800';
        case 'rejected': return '#f44336';
        case 'flagged': return '#FF5722';
        default: return '#666';
      }
    };

    const getModerationLabel = (status: string) => {
      switch (status) {
        case 'approved': return '';
        case 'pending': return 'En attente';
        case 'rejected': return 'Rejeté';
        case 'flagged': return 'À réviser';
        default: return status;
      }
    };

    if (loading) {
      return <div className="loading">Chargement des commentaires...</div>;
    }

    return (
      <div className="comment-list">
          {comments.length === 0 ? (
            <p className="no-comments">Aucun commentaire pour le moment.</p>
          ) : (
            <div className="comment-grid">
              {comments.map(comment => (
                <div key={comment.id} className="comment-card">
              <div className="comment-header">
                <div className="comment-info">
                  <h4 className="artwork-title">{comment.artwork.title}</h4>
                  <div className="comment-meta">
                    <span
                      className="sentiment-badge"
                      style={{ backgroundColor: getSentimentColor(comment.sentiment) }}
                    >
                      {getSentimentLabel(comment.sentiment)}
                    </span>
                    <span
                      className="moderation-badge"
                      style={{ backgroundColor: getModerationColor(comment.moderation_status) }}
                    >
                      {getModerationLabel(comment.moderation_status)}
                    </span>
                    <span className="comment-date">
                      {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <div className="comment-actions">
                  {onEdit && (
                    <button
                      className="action-button edit"
                      onClick={() => onEdit(comment)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="action-button delete"
                      onClick={() => onDelete(comment.id)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              <div className="comment-content">
                <p>{comment.content}</p>
                {comment.moderation_reason && (
                  <div className="moderation-reason">
                    <small style={{ color: '#f44336' }}>
                      <strong>Raison de modération:</strong> {comment.moderation_reason}
                    </small>
                  </div>
                )}
              </div>

              <div className="comment-footer">
                {/* Boutons like/dislike supprimés */}
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);