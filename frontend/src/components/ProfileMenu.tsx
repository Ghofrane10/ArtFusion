import React, { useState, useRef, useEffect } from "react";
import "./ProfileMenu.css";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  category: string;
  phone?: string;
  profile_picture?: string;
  artistic_nickname?: string;
}

interface ProfileMenuProps {
  user: User;
  onLogout: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getInitials = () => {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(
      0
    )}`.toUpperCase();
  };

  const getCategoryBadge = () => {
    const badges = {
      Artist: { label: "Artist", color: "#D4AF37" },
      Visiteur: { label: "Visiteur", color: "#6366F1" },
    };
    return badges[user.category as keyof typeof badges] || badges.Visiteur;
  };

  const badge = getCategoryBadge();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image valide");
      return;
    }

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/api/myprofile/", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Recharger la page pour actualiser la photo
        window.location.reload();
      } else {
        alert("Erreur lors de l'upload de la photo");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur réseau lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-menu-container" ref={menuRef}>
      <button
        className="profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu profil"
      >
        <div className="profile-avatar">
          {user.profile_picture ? (
            <img
              src={`http://localhost:8000${user.profile_picture}`}
              alt="Profile"
              className="avatar-image"
            />
          ) : (
            <span className="avatar-text">{getInitials()}</span>
          )}
        </div>
        <div className="profile-info">
          <span className="profile-name">
            {user.first_name} {user.last_name}
          </span>
          <span className="profile-role">{badge.label}</span>
        </div>
        <svg
          className={`dropdown-arrow ${isOpen ? "open" : ""}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-avatar">
              {user.profile_picture ? (
                <img
                  src={`http://localhost:8000${user.profile_picture}`}
                  alt="Profile"
                  className="avatar-image-large"
                />
              ) : (
                <span className="avatar-text-large">{getInitials()}</span>
              )}
            </div>
            <div className="dropdown-user-info">
              <h3>
                {user.first_name} {user.last_name}
                {user.artistic_nickname && (
                  <span className="artistic-nickname">"{user.artistic_nickname}"</span>
                )}
              </h3>
              <p className="user-email">{user.email}</p>
              <span
                className="user-badge"
                style={{ backgroundColor: badge.color }}
              >
                {badge.label}
              </span>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-body">
            <div className="user-details">
              <div className="detail-row">
                <svg
                  className="detail-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <div className="detail-content">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{user.email}</span>
                </div>
              </div>

              {user.phone && (
                <div className="detail-row">
                  <svg
                    className="detail-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <div className="detail-content">
                    <span className="detail-label">Téléphone</span>
                    <span className="detail-value">{user.phone}</span>
                  </div>
                </div>
              )}

              <div className="detail-row">
                <svg
                  className="detail-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <div className="detail-content">
                  <span className="detail-label">Rôle</span>
                  <span className="detail-value">{badge.label}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-footer">
            <div className="quick-actions">
              <button className="dropdown-action profile-action">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Mon Profil
              </button>
              <button
                className="dropdown-action photo-action"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                {uploading ? "Upload..." : "Changer la photo"}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: "none" }}
            />

            <div className="logout-section">
              <button className="logout-button" onClick={onLogout}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
