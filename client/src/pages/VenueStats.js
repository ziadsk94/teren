import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Clock,
  Users,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const API_URL = process.env.REACT_APP_API_URL;

const VenueStats = ({ language = "ro" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [venue, setVenue] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user?.admin) {
      navigate("/login");
      return;
    }
    fetchVenue();
  }, [id, token, navigate, user]);

  useEffect(() => {
    if (venue) {
      fetchStats();
      fetchHistory();
    }
  }, [venue, dateRange, currentPage]);

  const fetchVenue = async () => {
    try {
      const res = await fetch(`${API_URL}/api/venues/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch venue");
      const data = await res.json();
      setVenue(data);
      setLoading(false);
    } catch (err) {
      toast.error(err.message || "Eroare");
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/venues/${id}/statistics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch statistics");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      toast.error(err.message || "Eroare");
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/venues/${id}/history?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&page=${currentPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      toast.error(err.message || "Eroare");
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <h2>
          {language === "ro" ? "Terenul nu a fost găsit." : "Venue not found."}
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <h2>Error: {error.message}</h2>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h1 className="ui-heading" style={{ marginBottom: "1rem" }}>
          {venue.name} -{" "}
          {language === "ro" ? "Statistici și Istoric" : "Statistics & History"}
        </h1>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <label className="small">
              <Calendar size={16} style={{ marginRight: 6 }} />
              {language === "ro" ? "Data început" : "Start Date"}
            </label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              style={{ width: "100%", marginTop: 4 }}
            />
          </div>
          <div>
            <label className="small">
              <Calendar size={16} style={{ marginRight: 6 }} />
              {language === "ro" ? "Data sfârșit" : "End Date"}
            </label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              style={{ width: "100%", marginTop: 4 }}
            />
          </div>
        </div>

        {stats && (
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ marginBottom: "1rem" }}>
              {language === "ro" ? "Statistici" : "Statistics"}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <div className="card">
                <h3>
                  {language === "ro" ? "Total Rezervări" : "Total Bookings"}
                </h3>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {stats.totalBookings}
                </p>
              </div>
              <div className="card">
                <h3>
                  {language === "ro"
                    ? "Rezervări Externe"
                    : "External Bookings"}
                </h3>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {stats.externalBookings}
                </p>
              </div>
              <div className="card">
                <h3>
                  {language === "ro"
                    ? "Rezervări Utilizatori"
                    : "User Bookings"}
                </h3>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {stats.userBookings}
                </p>
              </div>
              <div className="card">
                <h3>
                  {language === "ro"
                    ? "Durată Medie (min)"
                    : "Average Duration (min)"}
                </h3>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {stats.averageDuration}
                </p>
              </div>
            </div>

            <div style={{ height: 400, marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>
                {language === "ro" ? "Rezervări pe Oră" : "Bookings by Hour"}
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(stats.bookingsByHour).map(
                    ([hour, count]) => ({
                      hour: `${hour}:00`,
                      count,
                    })
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="count"
                    fill="var(--primary)"
                    name={
                      language === "ro"
                        ? "Număr Rezervări"
                        : "Number of Bookings"
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ height: 400 }}>
              <h3 style={{ marginBottom: "1rem" }}>
                {language === "ro" ? "Rezervări pe Zi" : "Bookings by Day"}
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(stats.bookingsByDay).map(
                    ([date, count]) => ({
                      date,
                      count,
                    })
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="count"
                    fill="var(--primary)"
                    name={
                      language === "ro"
                        ? "Număr Rezervări"
                        : "Number of Bookings"
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {history && (
          <div>
            <h2 style={{ marginBottom: "1rem" }}>
              {language === "ro" ? "Istoric Rezervări" : "Booking History"}
            </h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              {history.bookings.map((booking, index) => (
                <div
                  key={index}
                  style={{
                    padding: "1rem",
                    background: "var(--light-gray)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                      }}
                    >
                      <Calendar size={16} />
                      <span>{booking.date}</span>
                      <Clock size={16} />
                      <span>
                        {booking.startTime} - {booking.endTime}
                      </span>
                      {booking.external ? (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "var(--primary-green)",
                            color: "white",
                            padding: "0.25rem 0.5rem",
                            borderRadius: 4,
                            fontSize: 12,
                          }}
                        >
                          <ExternalLink size={12} />
                          {language === "ro" ? "Extern" : "External"}
                        </span>
                      ) : (
                        booking.userDetails && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              background: "var(--primary)",
                              color: "white",
                              padding: "0.25rem 0.5rem",
                              borderRadius: 4,
                              fontSize: 12,
                            }}
                          >
                            <Users size={12} />
                            {booking.userDetails.name}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {history.totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "1rem",
                  marginTop: "2rem",
                }}
              >
                <button
                  className="ui-btn secondary"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                  {language === "ro" ? "Anterior" : "Previous"}
                </button>
                <span style={{ display: "flex", alignItems: "center" }}>
                  {language === "ro" ? "Pagina" : "Page"} {currentPage}{" "}
                  {language === "ro" ? "din" : "of"} {history.totalPages}
                </span>
                <button
                  className="ui-btn secondary"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(history.totalPages, p + 1))
                  }
                  disabled={currentPage === history.totalPages}
                >
                  {language === "ro" ? "Următorul" : "Next"}
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default VenueStats;
