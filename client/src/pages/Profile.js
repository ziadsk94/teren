import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Users, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

const API_URL = process.env.REACT_APP_API_URL;

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userGames, setUserGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem("user"));
    console.log("Profile page - User object from local storage:", userData);
    setUser(userData);

    // Get token from localStorage
    const token = localStorage.getItem("token");
    console.log("Profile page - Token from local storage:", token);

    if (token) {
      console.log("Profile page - Token found, attempting to fetch games...");
      // Fetch user's games
      fetch(`${API_URL}/api/users/me/games`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          console.log(
            "Profile page - Games fetch response status:",
            res.status
          );
          if (!res.ok) throw new Error(t("PROFILE.ERROR_FETCH_GAMES"));
          return res.json();
        })
        .then((data) => {
          console.log("Profile page - Fetched user games data:", data);
          setUserGames(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Profile page - Error fetching games:", err);
          setError(err.message);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [t]);

  if (loading) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          {t("PROFILE.LOADING")}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        <div
          className="card"
          style={{ textAlign: "center", color: "var(--accent-red)" }}
        >
          {error}
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          {t("PROFILE.NOT_LOGGED_IN")}
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 className="ui-heading">{t("PROFILE.TITLE")}</h1>

      <div className="card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>{t("PROFILE.ACCOUNT_INFO")}</h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <span className="small" style={{ color: "var(--mid-gray)" }}>
              {t("PROFILE.NAME")}
            </span>
            <p>{user.name}</p>
          </div>
          <div>
            <span className="small" style={{ color: "var(--mid-gray)" }}>
              {t("PROFILE.EMAIL")}
            </span>
            <p>{user.email}</p>
          </div>
          <div>
            <span className="small" style={{ color: "var(--mid-gray)" }}>
              {t("PROFILE.LOCATION")}
            </span>
            <p>{user.location}</p>
          </div>
        </div>
      </div>

      {/* Only show Joined Games section for non-admin users */}
      {!user.admin && (
        <div className="card">
          <h2 style={{ marginBottom: "1rem" }}>{t("PROFILE.JOINED_GAMES")}</h2>
          {userGames.length === 0 ? (
            <p style={{ color: "var(--mid-gray)" }}>{t("PROFILE.NO_GAMES")}</p>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {userGames.map((game) => (
                <Link
                  to={`/games/${game._id}`}
                  key={game._id}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      padding: "1rem",
                      background: "var(--light-gray)",
                      borderRadius: 8,
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                      ":hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      },
                    }}
                  >
                    <h3
                      style={{
                        marginBottom: "0.5rem",
                        color: "var(--primary)",
                      }}
                    >
                      {game.title}
                    </h3>
                    <p style={{ color: "var(--mid-gray)" }}>
                      {game.date} at {game.startTime}
                    </p>
                    <p style={{ color: "var(--mid-gray)" }}>
                      {game.venue?.location || game.location}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Users size={16} /> {game.totalPlayersCount || 0}/
                      {game.maxPlayers}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default Profile;
