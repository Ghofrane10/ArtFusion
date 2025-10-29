import React, { useState } from "react";
import "./LoginForms.css";

interface LoginFormProps {
  onLoginSuccess: (token: string, user: any) => void;
  onCancel: () => void;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onCancel,
  onForgotPassword,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Login failed.");
      } else {
        onLoginSuccess(data.token.access, data.user);
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reservation-form-overlay">
      <div className="reservation-form-container">
        <h3>Connexion</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Mot de passe:</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}

          <div className="forgot-password-link">
            <button
              type="button"
              onClick={onForgotPassword}
              className="link-button"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel}>
              Annuler
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={submitting}
            >
              {submitting ? "Connexion en cours..." : "Se connecter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
