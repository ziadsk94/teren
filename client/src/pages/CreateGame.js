import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Calendar, MapPin, Users, Clock, Info } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const skillLevels = [
  { ro: "Începător", en: "Beginner" },
  { ro: "Intermediar", en: "Intermediate" },
  { ro: "Avansat", en: "Advanced" },
];

function isThirtyMinuteInterval(timeStr) {
  if (!timeStr) return false;
  const [h, m] = timeStr.split(":").map(Number);
  return m === 0 || m === 30;
}

function generateTimeOptions(start = 6, end = 22) {
  const options = [];
  for (let h = start; h <= end; h++) {
    options.push(
      `${h.toString().padStart(2, "0")}:00`,
      `${h.toString().padStart(2, "0")}:30`
    );
  }
  // Remove the last :30 if end is a whole hour (e.g., 22:30 should not be included)
  if (options[options.length - 1] === `${end.toString().padStart(2, "0")}:30`) {
    options.pop();
  }
  return options;
}

const CreateGame = ({ language = "ro" }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
    // Fetch venues
    fetch(`${API_URL}/api/venues`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch venues");
        return res.json();
      })
      .then((data) => {
        setVenues(data);
        setLoadingVenues(false);
      })
      .catch((err) => {
        console.error("Error fetching venues:", err);
        setLoadingVenues(false);
      });
  }, [navigate]);

  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    maxPlayers: 10,
    preFilledPlayers: 0,
    skillLevel: "beginner",
    venue: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = true;
    if (!formData.startTime) newErrors.startTime = true;
    if (!formData.endTime) newErrors.endTime = true;
    if (!formData.venue) newErrors.venue = true;
    if (
      !formData.maxPlayers ||
      isNaN(formData.maxPlayers) ||
      formData.maxPlayers < 4 ||
      formData.maxPlayers > 30
    )
      newErrors.maxPlayers = true;
    if (!formData.skillLevel) newErrors.skillLevel = true;
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 30-minute interval validation
    if (
      !isThirtyMinuteInterval(formData.startTime) ||
      !isThirtyMinuteInterval(formData.endTime)
    ) {
      setError(
        "Start and end times must be on a 30-minute interval (e.g., 13:00, 13:30, 14:00)."
      );
      return;
    }
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        venue: formData.venue,
        maxPlayers: Number(formData.maxPlayers),
        preFilledPlayers: Number(formData.preFilledPlayers),
        skillLevel: formData.skillLevel,
        notes: formData.notes,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create game");
        return res.json();
      })
      .then((data) => {
        // Join the game after creation
        return fetch(`${API_URL}/api/games/${data._id}/join`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then(() => data);
      })
      .then(() => {
        setSubmitted(true);
        setLoading(false);
        toast.success(t("game.create.success"));
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        toast.error(err.message || t("game.details.error"));
      });
  };

  if (submitted) {
    return (
      <main style={{ maxWidth: 500, margin: "0 auto", padding: "2rem 1rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <PlusCircle size={40} color="var(--primary-green)" />
          <h2 style={{ margin: "1rem 0" }}>{t("game.create.success")}</h2>
          <p>{t("game.create.success_message")}</p>
          <a
            href="/games"
            className="ui-btn primary"
            style={{ marginTop: "1.5rem" }}
          >
            {t("game.create.view_games")}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 500, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 className="ui-heading" style={{ marginBottom: "2rem" }}>
        {t("game.create.title")}
      </h1>
      <form
        className="card"
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        <label>
          <span
            className="small"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Calendar size={16} /> {t("game.form.date")} *
          </span>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: errors.date
                ? "2px solid var(--accent-red)"
                : "1px solid var(--light-gray)",
              fontSize: "1rem",
              marginTop: 4,
              width: "100%",
            }}
          />
        </label>
        <div style={{ display: "flex", gap: "1rem" }}>
          <label style={{ flex: 1 }}>
            <span
              className="small"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Clock size={16} /> {t("game.form.start_time")} *
            </span>
            <select
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: 8,
                border: errors.startTime
                  ? "2px solid var(--accent-red)"
                  : "1px solid var(--light-gray)",
                fontSize: "1rem",
                marginTop: 4,
                width: "100%",
                background: "white",
              }}
              required
            >
              <option value="">--:--</option>
              {generateTimeOptions().map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label style={{ flex: 1 }}>
            <span
              className="small"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Clock size={16} /> {t("game.form.end_time")} *
            </span>
            <select
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: 8,
                border: errors.endTime
                  ? "2px solid var(--accent-red)"
                  : "1px solid var(--light-gray)",
                fontSize: "1rem",
                marginTop: 4,
                width: "100%",
                background: "white",
              }}
              required
            >
              <option value="">--:--</option>
              {generateTimeOptions().map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span
            className="small"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <MapPin size={16} /> {t("venue.management.title")} *
          </span>
          <select
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            disabled={loadingVenues}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: errors.venue
                ? "2px solid var(--accent-red)"
                : "1px solid var(--light-gray)",
              fontSize: "1rem",
              marginTop: 4,
              width: "100%",
              background: "white",
            }}
          >
            <option value="">
              {loadingVenues
                ? t("game.details.processing")
                : t("game.form.select_venue")}
            </option>
            {venues.map((venue) => (
              <option key={venue._id} value={venue._id}>
                {venue.name} - {venue.location}
              </option>
            ))}
          </select>
        </label>
        {/* Show selected venue price */}
        {formData.venue &&
          (() => {
            const selectedVenue = venues.find((v) => v._id === formData.venue);
            if (selectedVenue && selectedVenue.price) {
              return (
                <div
                  style={{
                    margin: "8px 0 16px 0",
                    color: "var(--dark-gray)",
                    fontWeight: 500,
                  }}
                >
                  {t("venue.management.price")}: {selectedVenue.price}{" "}
                  {selectedVenue.currency || "RON"} /{" "}
                  {t("hour", { defaultValue: "hour" })}
                </div>
              );
            }
            return null;
          })()}
        <div className="form-group">
          <label htmlFor="maxPlayers">{t("game.form.max_players")}</label>
          <input
            type="number"
            id="maxPlayers"
            name="maxPlayers"
            value={formData.maxPlayers}
            onChange={handleChange}
            min="2"
            max="22"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="preFilledPlayers">
            {t("game.form.pre_filled_players")}
          </label>
          <input
            type="number"
            id="preFilledPlayers"
            name="preFilledPlayers"
            value={formData.preFilledPlayers}
            onChange={handleChange}
            min="0"
            max={formData.maxPlayers - 1}
            required
          />
          <small>{t("game.form.pre_filled_players_help")}</small>
        </div>

        <label>
          <span
            className="small"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Info size={16} /> {t("game.form.skill_level")} *
          </span>
          <select
            name="skillLevel"
            value={formData.skillLevel}
            onChange={handleChange}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: errors.skillLevel
                ? "2px solid var(--accent-red)"
                : "1px solid var(--light-gray)",
              fontSize: "1rem",
              marginTop: 4,
              width: "100%",
              background: "white",
            }}
          >
            <option value="">{t("game.form.select_skill")}</option>
            {skillLevels.map((level) => (
              <option key={level[language]} value={level[language]}>
                {level[language]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span
            className="small"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Info size={16} /> {t("game.form.notes")}
          </span>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "1px solid var(--light-gray)",
              fontSize: "1rem",
              marginTop: 4,
              width: "100%",
              minHeight: 100,
              resize: "vertical",
            }}
          />
        </label>
        {error && (
          <div
            className="small"
            style={{ color: "var(--accent-red)", marginBottom: 8 }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          className="ui-btn primary"
          disabled={loading || loadingVenues}
        >
          {loading ? t("game.details.processing") : t("game.create.title")}
        </button>
      </form>
    </main>
  );
};

export default CreateGame;
