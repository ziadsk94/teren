import React, { useState, useEffect } from "react";
import { MapPin, Phone, Mail, Globe, Calendar, PlusCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Venues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    console.log("Fetching venues...");
    setLoading(true);
    fetch(`${API_URL}/api/venues`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t("venue.management.error_fetch"));
        return res.json();
      })
      .then((data) => {
        console.log("Venues data received:", data);
        setVenues(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching venues:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [t, token, API_URL]);

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
        <h1 className="ui-heading">{t("venues")}</h1>
        {user?.admin && (
          <button
            className="ui-btn primary"
            onClick={() => navigate("/venues/manage")}
          >
            <PlusCircle size={18} style={{ marginRight: 8 }} />
            {t("venue.management.add")}
          </button>
        )}
      </div>
      {loading ? (
        <div className="card" style={{ textAlign: "center" }}>
          {t("venue.management.loading")}
        </div>
      ) : error ? (
        <div
          className="card"
          style={{ textAlign: "center", color: "var(--accent-red)" }}
        >
          {!token ? (
            <>
              <h2>{t("auth.login_required")}</h2>
              <Link
                to="/login"
                className="ui-btn primary"
                style={{ marginTop: 16 }}
              >
                {t("auth.login")}
              </Link>
            </>
          ) : (
            error
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {venues.map((venue) => (
            <div key={venue._id} className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h3 style={{ marginBottom: "0.5rem" }}>{venue.name}</h3>
                  <div
                    style={{ color: "var(--mid-gray)", marginBottom: "0.5rem" }}
                  >
                    <MapPin
                      size={16}
                      style={{ marginRight: 4, verticalAlign: "middle" }}
                    />
                    {venue.address}, {venue.location}
                  </div>
                  {venue.description && (
                    <p style={{ marginBottom: "0.5rem" }}>
                      {venue.description}
                    </p>
                  )}
                  {venue.contactInfo && (
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {venue.contactInfo.phone && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Phone size={16} />
                          {venue.contactInfo.phone}
                        </span>
                      )}
                      {venue.contactInfo.email && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Mail size={16} />
                          {venue.contactInfo.email}
                        </span>
                      )}
                      {venue.contactInfo.website && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Globe size={16} />
                          {venue.contactInfo.website}
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    {venue.surfaceType && (
                      <span className="tag">{venue.surfaceType}</span>
                    )}
                    {venue.size && <span className="tag">{venue.size}</span>}
                    {venue.facilities?.map((facility) => (
                      <span key={facility} className="tag">
                        {t(
                          `venue.management.facility.${facility
                            .toLowerCase()
                            .replace(" ", "_")}`
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Link
                    to={`/venues/${venue._id}/book`}
                    className="ui-btn primary"
                    style={{ padding: "0.5rem" }}
                    title={t("venue.booking.book")}
                  >
                    <Calendar size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Venues;
