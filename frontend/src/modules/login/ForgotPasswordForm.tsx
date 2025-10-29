import React, { useState } from "react";
import "./LoginForms.css";

interface ForgotPasswordFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onCancel,
  onSuccess,
}) => {
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Étape 1 : Demander le token
  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        "http://localhost:8000/api/forgot-password-request/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStep("confirm");
        setError(null);
      } else {
        setError(
          data.detail ||
            data.email?.[0] ||
            "Erreur lors de la demande de réinitialisation."
        );
      }
    } catch (err) {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  // Étape 2 : Confirmer avec le token
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validation
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setSubmitting(false);
      return;
    }

    if (token.length !== 8) {
      setError("Le token doit contenir 8 chiffres.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/forgot-password-confirm/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(
          data.detail ||
            data.token?.[0] ||
            data.new_password?.[0] ||
            "Erreur lors de la réinitialisation."
        );
      }
    } catch (err) {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="reservation-form-overlay">
        <div className="reservation-form-container">
          <div className="success-message">
            <h3>Mot de passe réinitialisé avec succès !</h3>
            <p>
              Vous pouvez maintenant vous connecter avec votre nouveau mot de
              passe.
            </p>
            <p>Redirection en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reservation-form-overlay">
      <div className="reservation-form-container">
        {step === "request" ? (
          <>
            <h3>Mot de passe oublié</h3>
            <p className="form-description">
              Entrez votre adresse email pour recevoir un code de
              réinitialisation.
            </p>
            <form onSubmit={handleRequestToken}>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <div className="form-actions">
                <button type="button" onClick={onCancel}>
                  Annuler
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? "Envoi en cours..." : "Envoyer le code"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3>Réinitialiser le mot de passe</h3>
            <p className="form-description">
              Un code de réinitialisation a été envoyé à{" "}
              <strong>{email}</strong>.
              <br />
              Vérifiez votre boîte mail et entrez le code ci-dessous.
            </p>
            <form onSubmit={handleConfirmReset}>
              <div className="form-group">
                <label>Code de réinitialisation (8 chiffres):</label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) =>
                    setToken(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  required
                  placeholder="12345678"
                  maxLength={8}
                  pattern="\d{8}"
                />
              </div>

              <div className="form-group">
                <label>Nouveau mot de passe:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Au moins 8 caractères"
                />
              </div>

              <div className="form-group">
                <label>Confirmer le nouveau mot de passe:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Retapez votre mot de passe"
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <div className="password-requirements">
                <p>
                  <strong>Exigences du mot de passe :</strong>
                </p>
                <ul>
                  <li className={token.length === 8 ? "valid" : ""}>
                    Code de 8 chiffres
                  </li>
                  <li className={newPassword.length >= 8 ? "valid" : ""}>
                    Au moins 8 caractères
                  </li>
                  <li
                    className={
                      newPassword === confirmPassword && newPassword !== ""
                        ? "valid"
                        : ""
                    }
                  >
                    Les mots de passe correspondent
                  </li>
                </ul>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setStep("request")}>
                  Retour
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={
                    submitting ||
                    token.length !== 8 ||
                    newPassword !== confirmPassword ||
                    newPassword.length < 8
                  }
                >
                  {submitting
                    ? "Réinitialisation en cours..."
                    : "Réinitialiser le mot de passe"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
