import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Users, Calendar, Info, User } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const API_URL = process.env.REACT_APP_API_URL;

const GameDetails = () => {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch game details
  useEffect(() => {
    const fetchGameDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/games/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch game");
        }
        const data = await res.json();
        console.log(
          "Game data fetched successfully:",
          JSON.stringify(data, null, 2)
        );
        setGame(data);
      } catch (err) {
        setError(err.message);
        toast.error(err.message || t("game.details.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [id, t]); // Removed user?.id from dependency array

  // Check if user is in game whenever game data or user changes
  useEffect(() => {
    if (user && game && game.players) {
      const isUserInGame = game.players.some((p) => p && p._id === user.id);
      setJoined(isUserInGame);
    } else {
      setJoined(false);
    }
  }, [user, game]); // Depends on user and game

  const handleJoin = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    setJoinLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/games/${id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("game.details.error"));
      }
      const updatedGame = await res.json();
      setGame(updatedGame);
      setJoined(true);
      toast.success(t("game.details.joined"));
    } catch (err) {
      setError(err.message);
      toast.error(err.message || t("game.details.error"));
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!token) return;
    setJoinLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/games/${id}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("game.details.error"));
      }
      const updatedGame = await res.json();
      setGame(updatedGame);
      setJoined(false);
      toast.success(t("game.details.left"));
    } catch (err) {
      setError(err.message);
      toast.error(err.message || t("game.details.error"));
    } finally {
      setJoinLoading(false);
    }
  };

  // Helper: is the logged-in user the creator?
  const isCreator =
    user &&
    game &&
    game.createdBy &&
    (game.createdBy === user.id ||
      game.createdBy._id === user.id ||
      (typeof game.createdBy === "object" && game.createdBy._id === user.id) ||
      (typeof game.createdBy === "object" && game.createdBy.id === user.id));

  // Debug logs
  useEffect(() => {
    if (game) {
      console.log("=== Debug Info ===");
      console.log("Game ID:", game._id);
      console.log("Game createdBy:", game.createdBy);
      console.log("User ID:", user?.id);
      console.log("User:", user);
      console.log("Is Creator:", isCreator);
      console.log("Comparison:", {
        directMatch: game.createdBy === user?.id,
        objectIdMatch: game.createdBy?._id === user?.id,
        objectIdMatch2: game.createdBy?.id === user?.id,
      });
    }
  }, [game, user, isCreator]);

  const handleDelete = async () => {
    if (!window.confirm(t("game.details.delete_confirmation"))) return;
    setJoinLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/games/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("game.details.error"));
      }
      toast.success(t("game.details.deleted"));
      navigate("/games");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || t("game.details.error"));
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        {t("loading")}
      </div>
    );
  }
  if (error || !game) {
    return (
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <h2>{t("game.details.not_found")}</h2>
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

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Game Details Card */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h1 className="ui-heading" style={{ marginBottom: "1rem" }}>
          {game.title}
        </h1>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={18} /> {game.date} {game.startTime} - {game.endTime}
          </span>
          {game.venue && (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={18} /> {game.venue.name} (
              {game.venue.location || game.location})
            </span>
          )}
          {!game.venue && game.location && (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={18} /> {game.location}
            </span>
          )}

          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={18} /> {game.totalPlayersCount || 0}/{game.maxPlayers}
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
        {game.notes && (
          <div style={{ marginBottom: "1.5rem", color: "var(--dark-gray)" }}>
            <Info
              size={16}
              style={{ marginRight: 6, verticalAlign: "middle" }}
            />
            {game.notes}
          </div>
        )}
        {token ? (
          joined ? (
            <button
              className={`ui-btn secondary`}
              style={{ marginBottom: "1.5rem", minWidth: 140 }}
              onClick={handleLeave}
              disabled={joinLoading}
            >
              {joinLoading
                ? t("game.details.processing")
                : t("game.details.leave")}
            </button>
          ) : (
            <button
              className={`ui-btn primary`}
              style={{ marginBottom: "1.5rem", minWidth: 140 }}
              onClick={handleJoin}
              disabled={joinLoading}
            >
              {joinLoading
                ? t("game.details.processing")
                : t("game.details.join")}
            </button>
          )
        ) : (
          <Link
            to="/login"
            className="ui-btn primary"
            style={{ marginBottom: "1.5rem", minWidth: 140 }}
          >
            {t("game.details.login_to_join")}
          </Link>
        )}

        {/* Creator Actions */}
        {isCreator && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <Link to={`/games/${game._id}/edit`} className="ui-btn secondary">
              {t("game.details.edit_game")}
            </Link>
            <button
              onClick={handleDelete}
              className="ui-btn danger"
              disabled={joinLoading}
            >
              {joinLoading
                ? t("game.details.processing")
                : t("game.details.delete_game")}
            </button>
          </div>
        )}

        {/* Players List */}
        <div className="players-list" style={{ marginBottom: "1.5rem" }}>
          <h3>
            {t("game.details.players")} ({game.totalPlayersCount || 0}/
            {game.maxPlayers})
          </h3>
          {game.players && game.players.length > 0 ? (
            <ul>
              {game.players.map((player, index) => (
                <li key={index}>
                  <User size={16} style={{ verticalAlign: "middle" }} />
                  {typeof player === "string" ? player : player.username}
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("game.details.no_players")}</p>
          )}
        </div>

        {/* Map Section - Keep if needed, or remove */}
        {/* Commented out for now based on recent changes to Home page */}
        {/* <div className="map-container card">
          <h3 style={{ marginBottom: "1rem" }}>
            <Map size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t("game.details.map_placeholder")}
          </h3>
          </div> */}
      </div>
    </main>
  );
};

export default GameDetails;
