import React, { useState } from "react";
import "./LoginForms.css";

interface SignupFormProps {
  onSignupSuccess: () => void;
  onCancel: () => void;
}

interface SignupFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  category: string;
}

const SignupForm: React.FC<SignupFormProps> = ({
  onSignupSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    category: "Visiteur",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validation des mots de passe
    if (formData.password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setSubmitting(false);
      return;
    }

    // Validation de la force du mot de passe
    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setSubmitting(false);
      return;
    }

    try {
      console.log("Données envoyées:", formData); // Debug

      const response = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Réponse du serveur:", data); // Debug

      if (!response.ok) {
        // Gérer les différents types d'erreurs
        let errorMessage = "Erreur lors de la création du compte.";

        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.email) {
          errorMessage = `Email: ${
            Array.isArray(data.email) ? data.email[0] : data.email
          }`;
        } else if (data.password) {
          errorMessage = `Mot de passe: ${
            Array.isArray(data.password) ? data.password[0] : data.password
          }`;
        } else if (data.category) {
          errorMessage = `Catégorie: ${
            Array.isArray(data.category) ? data.category[0] : data.category
          }`;
        } else {
          // Afficher tous les champs avec des erreurs
          const errors = Object.entries(data).map(([key, value]) => {
            const errorText = Array.isArray(value) ? value[0] : value;
            return `${key}: ${errorText}`;
          });
          errorMessage = errors.join(", ");
        }

        setError(errorMessage);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onSignupSuccess();
        }, 2000);
      }
    } catch (err) {
      console.error("Erreur complète:", err);
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (success) {
    return (
      <div className="reservation-form-overlay">
        <div className="reservation-form-container">
          <div className="success-message">
            <h3>Compte créé avec succès !</h3>
            <p>Un email de bienvenue a été envoyé à {formData.email}</p>
            <p>Redirection en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reservation-form-overlay">
      <div className="reservation-form-container">
        <h3>Créer un Compte</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Prénom:</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                placeholder="Votre prénom"
              />
            </div>
            <div className="form-group">
              <label>Nom:</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="votre@email.com"
            />
          </div>

          <div className="form-group">
            <label>Téléphone (optionnel):</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Votre numéro de téléphone"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mot de passe:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Au moins 6 caractères"
              />
            </div>
            <div className="form-group">
              <label>Confirmer le mot de passe:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Retapez votre mot de passe"
              />
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="password-requirements">
            <p>
              <strong>Exigences du mot de passe :</strong>
            </p>
            <ul>
              <li className={formData.password.length >= 6 ? "valid" : ""}>
                Au moins 6 caractères
              </li>
              <li
                className={
                  formData.password === confirmPassword &&
                  formData.password !== ""
                    ? "valid"
                    : ""
                }
              >
                Les mots de passe correspondent
              </li>
            </ul>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel}>
              Annuler
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={
                submitting ||
                formData.password !== confirmPassword ||
                formData.password.length < 6
              }
            >
              {submitting ? "Création en cours..." : "Créer le compte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
