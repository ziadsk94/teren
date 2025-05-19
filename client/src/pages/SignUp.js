import React, { useState } from "react";

const SignUp = ({ language = "ro" }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    location: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
        <h2>
          {language === "ro" ? "Cont creat cu succes!" : "Account created!"}
        </h2>
        <a href="/login" className="ui-btn primary" style={{ marginTop: 16 }}>
          {language === "ro" ? "Autentifică-te" : "Log in"}
        </a>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h1 className="ui-heading" style={{ marginBottom: 24 }}>
        {language === "ro" ? "Înregistrare" : "Sign Up"}
      </h1>
      <form
        className="card"
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <input
          name="name"
          placeholder={language === "ro" ? "Nume" : "Name"}
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="username"
          placeholder={language === "ro" ? "Nume de utilizator" : "Username"}
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder={language === "ro" ? "Parolă" : "Password"}
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          name="location"
          placeholder={language === "ro" ? "Oraș" : "City"}
          value={form.location}
          onChange={handleChange}
        />
        {error && (
          <div className="small" style={{ color: "var(--accent-red)" }}>
            {error}
          </div>
        )}
        <button className="ui-btn primary" type="submit">
          {language === "ro" ? "Înregistrează-te" : "Sign Up"}
        </button>
      </form>
    </main>
  );
};

export default SignUp;
