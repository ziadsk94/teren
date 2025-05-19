import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PlusCircle, Calendar, MapPin, Users, Clock, Info } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const skillLevels = [
  { ro: "Începător", en: "Beginner" },
  { ro: "Intermediar", en: "Intermediate" },
  { ro: "Avansat", en: "Advanced" },
];

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

const EditGame = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Separate states for venues
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [errorVenues, setErrorVenues] = useState(null);

  // Separate states for game data
  const [game, setGame] = useState(null); // State to hold fetched game data
  const [loadingGame, setLoadingGame] = useState(true);
  const [errorGame, setErrorGame] = useState(null);

  const [form, setForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    maxPlayers: "",
    preFilledPlayers: "",
    skillLevel: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  const API_URL = process.env.REACT_APP_API_URL;

  // Effect to fetch initial data
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Reset loading states on ID change
    setLoadingGame(true);
    setLoadingVenues(true);
    setErrorGame(null);
    setErrorVenues(null);

    // Fetch venues
    console.log("Fetching venues...");
    fetch(`${API_URL}/api/venues`)
      .then((res) => {
        if (!res.ok) throw new Error(t("venue.management.error_fetch"));
        return res.json();
      })
      .then((data) => {
        console.log("Venues fetched successfully:", data);
        setVenues(data);
        setLoadingVenues(false);
      })
      .catch((err) => {
        console.error("Error fetching venues:", err);
        setErrorVenues(err);
        setLoadingVenues(false);
        toast.error(err.message);
      });

    // Fetch game data
    console.log(`Fetching game ${id}...`);
    fetch(`${API_URL}/api/games/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t("game.details.not_found"));
        return res.json();
      })
      .then((data) => {
        console.log("Game data fetched successfully:", data);
        setGame(data); // Store fetched game data temporarily

        // Perform creator check immediately after fetching game data
        // Check if user object is available and has an id property
        const currentUser = localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user"))
          : null;

        const isCreator =
          currentUser &&
          data.createdBy &&
          data.createdBy._id === currentUser.id;
        console.log("Is Creator check result:", isCreator);

        if (!isCreator) {
          toast.error(t("game.edit.permission_error"));
          navigate("/games");
          // Stop loading state if not creator
          setLoadingGame(false);
          return Promise.reject(new Error("Not authorized to edit this game")); // Reject to propagate error
        }

        // Set form data only after successful fetch and creator check
        console.log("Setting form data with:", {
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          venue: data.venue?._id || "",
          maxPlayers: data.maxPlayers,
          preFilledPlayers: data.players
            ? data.players.filter((player) => typeof player === "string").length
            : 0,
          skillLevel: data.skillLevel || data.skill,
          notes: data.notes || "",
        });
        setForm({
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          venue: data.venue?._id || "",
          maxPlayers: data.maxPlayers,
          preFilledPlayers: data.players
            ? data.players.filter((player) => typeof player === "string").length
            : 0,
          skillLevel: data.skillLevel || data.skill,
          notes: data.notes || "",
        });

        setLoadingGame(false);
      })
      .catch((err) => {
        console.error("Error fetching game:", err);
        setErrorGame(err);
        setLoadingGame(false);
        // Only show toast for actual fetch/auth errors, not the rejected promise from isCreator check
        if (!err.message.includes("Not authorized")) {
          toast.error(err.message || t("game.details.error"));
        }
      });
  }, [id, token, navigate, t]); // Dependencies: id and token, navigate and t are stable

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.date) newErrors.date = true;
    if (!form.startTime) newErrors.startTime = true;
    if (!form.endTime) newErrors.endTime = true;
    if (!form.venue) newErrors.venue = true;
    if (
      !form.maxPlayers ||
      isNaN(form.maxPlayers) ||
      form.maxPlayers < 4 ||
      form.maxPlayers > 30
    )
      newErrors.maxPlayers = true;
    if (!form.skillLevel) newErrors.skillLevel = true;
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    setErrorGame(null);
    try {
      const res = await fetch(`${API_URL}/api/games/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          venue: form.venue,
          maxPlayers: Number(form.maxPlayers),
          preFilledPlayers: Number(form.preFilledPlayers),
          skillLevel: form.skillLevel,
          notes: form.notes,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("game.edit.success"));
      }
      toast.success(t("game.edit.success"));
      navigate(`/games/${id}`);
    } catch (err) {
      setErrorGame(err);
      toast.error(err.message || t("game.edit.error"));
    } finally {
      setSubmitting(false);
    }
  };

  // Render loading state if either fetch is in progress
  if (loadingGame || loadingVenues) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        {t("loading")}
      </div>
    );
  }

  // Render error state if either fetch failed
  if (errorGame || errorVenues) {
    return (
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <h2>{t("error")}</h2> {/* Use a generic error translation */}
          {errorGame && <p>{errorGame.message}</p>}
          {errorVenues && <p>{errorVenues.message}</p>}
          <Link
            to="/games"
            className="ui-btn secondary"
            style={{ marginTop: "1.5rem" }}
          >
            {t("game.details.back_to_games")}
          </Link>
        </div>
      </main>
    );
  }

  // Render form only when data is loaded and no errors
  if (!game) return null; // Should not happen if loading/error checks pass, but as a safeguard

  return (
    <main style={{ maxWidth: 500, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 className="ui-heading" style={{ marginBottom: "2rem" }}>
        {t("game.edit.title")}
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
            value={form.date}
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
              value={form.startTime}
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
              value={form.endTime}
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
            value={form.venue}
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
              {loadingVenues ? t("loading") : t("game.form.select_venue")}
            </option>
            {venues.map((venue) => (
              <option key={venue._id} value={venue._id}>
                {venue.name} - {venue.location}
              </option>
            ))}
          </select>
        </label>
        {/* Show selected venue price */}
        {form.venue &&
          (() => {
            const selectedVenue = venues.find((v) => v._id === form.venue);
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
        <label>
          <span
            className="small"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Users size={16} /> {t("game.form.max_players")} *
          </span>
          <input
            type="number"
            name="maxPlayers"
            value={form.maxPlayers}
            onChange={handleChange}
            min={4}
            max={30}
            placeholder="10"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: errors.maxPlayers
                ? "2px solid var(--accent-red)"
                : "1px solid var(--light-gray)",
              fontSize: "1rem",
              marginTop: 4,
              width: "100%",
            }}
          />
        </label>
        <label>
          <span
            className="small"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Info size={16} /> {t("game.form.skill_level")} *
          </span>
          <select
            name="skillLevel"
            value={form.skillLevel}
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
            }}
          >
            <option value="">{t("game.form.select_skill")}</option>
            {skillLevels.map((level) => (
              <option key={level.en} value={level.en}>
                {t(`venue.management.surface.${level.en.toLowerCase()}`)}
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
            value={form.notes}
            onChange={handleChange}
            rows={3}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "1px solid var(--light-gray)",
              fontSize: "1rem",
              marginTop: 4,
              width: "100%",
              resize: "vertical",
            }}
          />
        </label>
        <div className="form-group">
          <label htmlFor="preFilledPlayers">
            {t("game.form.pre_filled_players")}
          </label>
          <input
            type="number"
            id="preFilledPlayers"
            name="preFilledPlayers"
            value={form.preFilledPlayers}
            onChange={handleChange}
            min="0"
            max={
              form.maxPlayers
                ? form.maxPlayers -
                  (game?.players?.filter((p) => typeof p === "object").length ||
                    0)
                : 0
            }
            required
          />
          <small>{t("game.form.pre_filled_players_help")}</small>
        </div>
        {errorGame && (
          <div className="small" style={{ color: "var(--accent-red)" }}>
            {errorGame.message}
          </div>
        )}
        <button
          type="submit"
          className="ui-btn primary"
          style={{ marginTop: "1rem" }}
          disabled={submitting}
        >
          {submitting ? (
            <span>{t("game.edit.saving")}</span>
          ) : (
            <>
              <PlusCircle
                size={18}
                style={{ marginRight: 8, verticalAlign: "middle" }}
              />
              {t("game.edit.save_changes")}
            </>
          )}
        </button>
        <div
          className="small"
          style={{ color: "var(--mid-gray)", marginTop: "0.5rem" }}
        >
          * {t("venue.management.required_field")}
        </div>
      </form>
    </main>
  );
};

export default EditGame;
