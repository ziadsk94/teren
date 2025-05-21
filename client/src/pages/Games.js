import React, { useState, useEffect } from "react";
import { MapPin, Users, Calendar, Filter, PlusCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const API_URL = process.env.REACT_APP_API_URL;

const Games = ({ language = "ro" }) => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  // Filters
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/games`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch games");
        }
        const data = await res.json();
        console.log("Fetched games data:", data);
        setGames(data);
      } catch (err) {
        console.error("Error fetching games:", err);
        setError(err.message);
        toast.error(err.message || t("game.details.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [t]);

  // Unique locations and skills for filters
  const unique = (arr) => [...new Set(arr)];
  const locations = unique(games.map((g) => g.venue?.location || g.location));
  const skills = unique(games.map((g) => g.skillLevel || g.skill));

  // Filtered games
  const filteredGames = games.filter((game) => {
    const gameEndTime = new Date(`${game.date}T${game.endTime}`);
    const now = new Date();
    return (
      gameEndTime > now &&
      (!date || game.date === date) &&
      (!location || (game.venue?.location || game.location) === location) &&
      (!skill || (game.skillLevel || game.skill) === skill)
    );
  });

  console.log("Filtered games:", filteredGames);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 className="ui-heading">
          {language === "ro" ? "Meciuri disponibile" : "Available Games"}
        </h1>
        <button
          className="ui-btn primary"
          onClick={() => {
            console.log(
              "Create Game button clicked, navigating to /games/create"
            );
            navigate("/games/create");
          }}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <PlusCircle size={18} />
          {language === "ro" ? "Creează Meci" : "Create Game"}
        </button>
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{
          marginBottom: "2rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={18} />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              border: "1px solid var(--mid-gray)",
              borderRadius: 8,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={18} />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              border: "1px solid var(--mid-gray)",
              borderRadius: 8,
              fontSize: "1rem",
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              paddingRight: "2.5rem",
            }}
          >
            <option value="">
              {language === "ro" ? "Toate locațiile" : "All locations"}
            </option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter size={18} />
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              border: "1px solid var(--mid-gray)",
              borderRadius: 8,
              fontSize: "1rem",
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              paddingRight: "2.5rem",
            }}
          >
            <option value="">
              {language === "ro" ? "Toate nivelurile" : "All levels"}
            </option>
            {skills.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card" style={{ textAlign: "center" }}>
          {t("loading")}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="card"
          style={{ textAlign: "center", color: "var(--accent-red)" }}
        >
          {error}
        </div>
      )}

      {/* Games list */}
      {!loading && !error && (
        <div style={{ display: "grid", gap: "2rem" }}>
          {filteredGames.length === 0 ? (
            <div
              className="card"
              style={{ textAlign: "center", color: "var(--mid-gray)" }}
            >
              {language === "ro"
                ? "Nu există meciuri care să corespundă filtrului."
                : "No games match your filter."}
            </div>
          ) : (
            filteredGames.map((game) => (
              <Link
                to={`/games/${game._id || game.id}`}
                key={game._id || game.id}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="card">
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "1.5rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Calendar size={18} /> {game.date} {game.startTime} -{" "}
                      {game.endTime}
                    </span>
                    {game.venue && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <MapPin size={18} /> {game.venue.name} (
                        {game.venue.location || game.location})
                      </span>
                    )}
                    {!game.venue && game.location && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <MapPin size={18} /> {game.location}
                      </span>
                    )}
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Users size={18} /> {game.totalPlayersCount || 0}/
                      {game.maxPlayers}
                    </span>
                    <span
                      style={{
                        background: "var(--light-gray)",
                        borderRadius: 8,
                        padding: "0.25rem 0.75rem",
                        fontSize: 14,
                      }}
                    >
                      {game.skillLevel || game.skill}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </main>
  );
};

export default Games;
