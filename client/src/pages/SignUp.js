import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const SignUp = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    location: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { t } = useTranslation();

  const API_URL = process.env.REACT_APP_API_URL;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Registration failed");
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (success) {
    return (
      <div
        className="card"
        style={{ maxWidth: 400, margin: "2rem auto", textAlign: "center" }}
      >
        <h2>{t("auth.signup_success")}</h2>
        <Link to="/login" className="ui-btn primary" style={{ marginTop: 16 }}>
          {t("auth.login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>{t("auth.signup")}</h1>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <input
            name="name"
            placeholder={t("auth.name")}
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="username"
            placeholder={t("auth.username")}
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder={t("auth.email")}
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder={t("auth.password")}
            value={form.password}
            onChange={handleChange}
            required
          />
          <input
            name="location"
            placeholder={t("auth.city")}
            value={form.location}
            onChange={handleChange}
          />
          {error && (
            <div className="small" style={{ color: "var(--accent-red)" }}>
              {error}
            </div>
          )}
          <button className="ui-btn primary" type="submit">
            {t("auth.signup")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
