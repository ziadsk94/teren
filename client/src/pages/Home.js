// src/pages/Home.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Users, Calendar, PlusCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import heroBg from "../assets/hero-bg.jpg";

const Home = () => {
  const { t } = useTranslation();

  // Set the hero background image as a CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--hero-bg", `url(${heroBg})`);
  }, []);

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/api/games`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch games");
        return res.json();
      })
      .then((data) => {
        // Filter games that have available spots
        const availableGames = data.filter((game) => {
          const gameEndTime = new Date(`${game.date}T${game.endTime}`);
          const now = new Date();
          return gameEndTime > now && game.players.length < game.maxPlayers;
        });
        setGames(availableGames);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching games:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="home-page">
      <section
        className="hero"
        style={{
          backgroundImage: "var(--hero-bg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
          padding: "2rem",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 800 }}>
          <h1
            className="ui-heading"
            style={{ fontSize: "3rem", marginBottom: "1rem" }}
          >
            {t("hero.title")}
          </h1>
          <p style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
            {t("hero.subtitle")}
          </p>
          <div
            style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
          >
            <Link to="/games" className="ui-btn primary">
              {t("find_games")}
            </Link>
            <Link to="/games/create" className="ui-btn secondary">
              {t("create_game")}
            </Link>
          </div>
        </div>
      </section>

      <section
        style={{ padding: "4rem 2rem", background: "var(--light-gray)" }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
            }}
          >
            <h2 className="ui-heading">{t("available_games")}</h2>
            <Link
              to="/games"
              className="ui-btn secondary"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <PlusCircle size={18} />
              {t("view_all_games")}
            </Link>
          </div>

          {loading ? (
            <div className="card" style={{ textAlign: "center" }}>
              {t("loading")}
            </div>
          ) : games.length === 0 ? (
            <div
              className="card"
              style={{ textAlign: "center", color: "var(--mid-gray)" }}
            >
              {t("no_available_games")}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "2rem",
              }}
            >
              {games.map((game) => (
                <Link
                  to={`/games/${game._id}`}
                  key={game._id}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    className="card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                      height: "100%",
                      transition: "transform 0.2s ease",
                      ":hover": {
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <MapPin size={20} color="var(--primary-green)" />
                      <span style={{ fontWeight: 600 }}>
                        {game.venue?.location || game.location}
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", gap: 24, alignItems: "center" }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Calendar size={16} /> {game.date} {game.startTime}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Users size={16} /> {game.totalPlayersCount || 0}/
                        {game.maxPlayers}
                      </span>
                    </div>
                    <span
                      style={{
                        background: "var(--light-gray)",
                        borderRadius: 8,
                        padding: "0.25rem 0.75rem",
                        fontSize: 14,
                        alignSelf: "flex-start",
                      }}
                    >
                      {game.skillLevel || game.skill}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            className="ui-heading"
            style={{ textAlign: "center", marginBottom: "3rem" }}
          >
            {t("how_it_works.title")}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "2rem",
            }}
          >
            <div className="card" style={{ textAlign: "center" }}>
              <h3 style={{ marginBottom: "1rem" }}>
                {t("how_it_works.step1.title")}
              </h3>
              <p style={{ color: "var(--mid-gray)" }}>
                {t("how_it_works.step1.description")}
              </p>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <h3 style={{ marginBottom: "1rem" }}>
                {t("how_it_works.step2.title")}
              </h3>
              <p style={{ color: "var(--mid-gray)" }}>
                {t("how_it_works.step2.description")}
              </p>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <h3 style={{ marginBottom: "1rem" }}>
                {t("how_it_works.step3.title")}
              </h3>
              <p style={{ color: "var(--mid-gray)" }}>
                {t("how_it_works.step3.description")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
