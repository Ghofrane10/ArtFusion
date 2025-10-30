import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Reservation } from "./types";

interface ReservationListProps {
  onStatusChange: (
    reservationId: number,
    status: Reservation["status"]
  ) => void;
  onDelete: (reservationId: number) => void;
  userRole?: string;
}

export interface ReservationListRef {
  refresh: () => void;
}

const ReservationList = forwardRef<ReservationListRef, ReservationListProps>(
  ({ onStatusChange, onDelete, userRole }, ref) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReservations = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch("http://127.0.0.1:8000/api/reservations/", {
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {},
        });
        const data = await response.json();
        setReservations(data);
      } catch (error) {
        console.error("Erreur lors du chargement des réservations:", error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchReservations();
    }, []);

    // Fonction pour rafraîchir les données
    const refreshReservations = () => {
      fetchReservations();
    };

    // Exposer la fonction de rafraîchissement via useImperativeHandle
    useImperativeHandle(ref, () => ({
      refresh: refreshReservations,
    }));

    const getStatusLabel = (status: Reservation["status"]) => {
      const labels = {
        pending: "En attente",
        confirmed: "Confirmée",
        delivered: "Livrée",
        cancelled: "Annulée",
      };
      return labels[status];
    };

    const getStatusColor = (status: Reservation["status"]) => {
      const colors = {
        pending: "status-pending",
        confirmed: "status-confirmed",
        delivered: "status-delivered",
        cancelled: "status-cancelled",
      };
      return colors[status];
    };

    if (loading) {
      return <div className="loading">Chargement des réservations...</div>;
    }

    if (!Array.isArray(reservations)) {
      return (
        <div className="error-message">
          Aucune réservation à afficher ou accès non autorisé.
        </div>
      );
    }

    return (
      <div className="reservations-list">
        {reservations.map((reservation) => (
          <div key={reservation.id} className="reservation-card">
            <div className="reservation-header">
              <h3>{reservation.artwork.title}</h3>
              <span
                className={`status-badge ${getStatusColor(reservation.status)}`}
              >
                {getStatusLabel(reservation.status)}
              </span>
            </div>
            <div className="reservation-details">
              <div className="detail-row">
                <span className="label">Client:</span>
                <span>{reservation.full_name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span>{reservation.email}</span>
              </div>
              <div className="detail-row">
                <span className="label">Téléphone:</span>
                <span>{reservation.phone}</span>
              </div>
              <div className="detail-row">
                <span className="label">Adresse:</span>
                <span>{reservation.address}</span>
              </div>
              <div className="detail-row">
                <span className="label">Quantité:</span>
                <span>{reservation.quantity}</span>
              </div>
              <div className="detail-row">
                <span className="label">Date de réservation:</span>
                <span>
                  {new Date(reservation.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
              {reservation.notes && (
                <div className="detail-row">
                  <span className="label">Notes:</span>
                  <span>{reservation.notes}</span>
                </div>
              )}
            </div>
            <div className="reservation-actions">
              <select
                value={reservation.status}
                onChange={(e) =>
                  onStatusChange(
                    reservation.id,
                    e.target.value as Reservation["status"]
                  )
                }
                className="status-select"
                disabled={userRole !== 'Artist'}
              >
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
              <button
                className="delete-button"
                onClick={() => onDelete(reservation.id)}
                disabled={userRole !== 'Artist'}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

ReservationList.displayName = "ReservationList";

export default ReservationList;
