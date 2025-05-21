import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  PlusCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit2,
  Trash2,
  Calendar,
  BarChart2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const API_URL = process.env.REACT_APP_API_URL;

const VenueManagement = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const { t } = useTranslation();

  const [form, setForm] = useState({
    name: "",
    address: "",
    location: "",
    description: "",
    coordinates: { lat: "", lng: "" },
    contactInfo: { phone: "", email: "", website: "" },
    facilities: [],
    surfaceType: "",
    size: "",
    price: "",
    currency: "RON",
  });

  const fetchVenues = useCallback(async () => {
    try {
      console.log("Fetching venues with token:", token);
      const res = await fetch(`${API_URL}/api/venues`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(t("venue.management.error_fetch"));
      const data = await res.json();
      console.log("Fetched venues:", data);

      setVenues(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching venues:", err);
      setError(err.message);
      setLoading(false);
      toast.error(err.message || t("venue.management.error"));
    }
  }, [token, t]);

  useEffect(() => {
    if (!token || !user?.admin) {
      navigate("/login");
      return;
    }
    fetchVenues();
  }, [token, user, navigate, fetchVenues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setForm((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFacilityChange = (e) => {
    const { value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      facilities: checked
        ? [...prev.facilities, value]
        : prev.facilities.filter((f) => f !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingVenue
        ? `${API_URL}/api/venues/${editingVenue._id}`
        : `${API_URL}/api/venues`;
      const method = editingVenue ? "PUT" : "POST";

      const formData = {
        ...form,
        coordinates: {
          lat: form.coordinates.lat ? Number(form.coordinates.lat) : undefined,
          lng: form.coordinates.lng ? Number(form.coordinates.lng) : undefined,
        },
        price: form.price ? Number(form.price) : undefined,
      };

      console.log("Submitting venue data:", formData);
      const res = await fetch(url.replace("/api", `${API_URL}/api`), {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || t("venue.management.error_save"));
      }

      const savedVenue = await res.json();
      console.log("Saved venue:", savedVenue);

      toast.success(
        editingVenue
          ? t("venue.management.update_success")
          : t("venue.management.add_success")
      );

      setShowForm(false);
      setEditingVenue(null);
      setForm({
        name: "",
        address: "",
        location: "",
        description: "",
        coordinates: { lat: "", lng: "" },
        contactInfo: { phone: "", email: "", website: "" },
        facilities: [],
        surfaceType: "",
        size: "",
        price: "",
        currency: "RON",
      });
      fetchVenues();
    } catch (err) {
      console.error("Error saving venue:", err);
      setError(err.message);
      toast.error(err.message || t("venue.management.error"));
    }
  };

  const handleDelete = async (venueId) => {
    if (!window.confirm(t("venue.management.delete_confirmation"))) return;

    try {
      const res = await fetch(`${API_URL}/api/venues/${venueId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(t("venue.management.error_delete"));
      toast.success(t("venue.management.delete_success"));
      fetchVenues();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || t("venue.management.error"));
    }
  };

  const handleEdit = (venue) => {
    setEditingVenue(venue);
    setForm({
      name: venue.name,
      address: venue.address,
      location: venue.location,
      description: venue.description || "",
      coordinates: venue.coordinates || { lat: "", lng: "" },
      contactInfo: venue.contactInfo || { phone: "", email: "", website: "" },
      facilities: venue.facilities || [],
      surfaceType: venue.surfaceType || "",
      size: venue.size || "",
      price: venue.price || "",
      currency: venue.currency || "RON",
    });
    setShowForm(true);
  };

  const filteredVenues = venues.filter((venue) =>
    user?.admin ? venue.createdBy === user._id : true
  );

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        {t("venue.management.loading")}
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 className="ui-heading">{t("venue.management.title")}</h1>
        <button
          className="ui-btn primary"
          onClick={() => {
            setShowForm(true);
            setEditingVenue(null);
            setForm({
              name: "",
              address: "",
              location: "",
              description: "",
              coordinates: { lat: "", lng: "" },
              contactInfo: { phone: "", email: "", website: "" },
              facilities: [],
              surfaceType: "",
              size: "",
              price: "",
              currency: "RON",
            });
          }}
        >
          <PlusCircle size={18} style={{ marginRight: 8 }} />
          {t("venue.management.add")}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>
            {editingVenue
              ? t("venue.management.edit")
              : t("venue.management.add")}
          </h2>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <label className="small">{t("venue.management.name")} *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>
            <div>
              <label className="small">{t("venue.management.address")} *</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>
            <div>
              <label className="small">
                {t("venue.management.location")} *
              </label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>
            <div>
              <label className="small">
                {t("venue.management.description")}
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label className="small">
                  {t("venue.management.latitude")}
                </label>
                <input
                  type="number"
                  step="any"
                  name="coordinates.lat"
                  value={form.coordinates.lat}
                  onChange={handleChange}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="small">
                  {t("venue.management.longitude")}
                </label>
                <input
                  type="number"
                  step="any"
                  name="coordinates.lng"
                  value={form.coordinates.lng}
                  onChange={handleChange}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label className="small">{t("venue.management.phone")}</label>
                <input
                  type="tel"
                  name="contactInfo.phone"
                  value={form.contactInfo.phone}
                  onChange={handleChange}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="small">{t("venue.management.email")}</label>
                <input
                  type="email"
                  name="contactInfo.email"
                  value={form.contactInfo.email}
                  onChange={handleChange}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>
            </div>
            <div>
              <label className="small">{t("venue.management.website")}</label>
              <input
                type="url"
                name="contactInfo.website"
                value={form.contactInfo.website}
                onChange={handleChange}
                style={{ width: "100%", marginTop: 4 }}
              />
            </div>
            <div>
              <label className="small">
                {t("venue.management.surface_type")}
              </label>
              <select
                name="surfaceType"
                value={form.surfaceType}
                onChange={handleChange}
                style={{ width: "100%", marginTop: 4 }}
              >
                <option value="">{t("venue.management.select_surface")}</option>
                <option value="Grass">
                  {t("venue.management.surface.grass")}
                </option>
                <option value="Artificial Turf">
                  {t("venue.management.surface.artificial")}
                </option>
                <option value="Concrete">
                  {t("venue.management.surface.concrete")}
                </option>
              </select>
            </div>
            <div>
              <label className="small">{t("venue.management.size")}</label>
              <select
                name="size"
                value={form.size}
                onChange={handleChange}
                style={{ width: "100%", marginTop: 4 }}
              >
                <option value="">{t("venue.management.select_size")}</option>
                <option value="Full Size">
                  {t("venue.management.size_options.full")}
                </option>
                <option value="Half Size">
                  {t("venue.management.size_options.half")}
                </option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label className="small">{t("venue.management.price")}</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g. 100"
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="small">
                  {t("venue.management.currency")}
                </label>
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  style={{ width: "100%", marginTop: 4 }}
                >
                  <option value="RON">RON</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div>
              <label className="small">
                {t("venue.management.facilities")}
              </label>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginTop: 4,
                }}
              >
                {[
                  "Parking",
                  "Showers",
                  "Changing Rooms",
                  "Lights",
                  "Seating",
                ].map((facility) => (
                  <label
                    key={facility}
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <input
                      type="checkbox"
                      value={facility}
                      checked={form.facilities.includes(facility)}
                      onChange={handleFacilityChange}
                    />
                    {t(
                      `venue.management.facility.${facility
                        .toLowerCase()
                        .replace(" ", "_")}`
                    )}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="submit" className="ui-btn primary">
                {editingVenue
                  ? t("venue.management.save")
                  : t("venue.management.add")}
              </button>
              <button
                type="button"
                className="ui-btn secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingVenue(null);
                }}
              >
                {t("venue.management.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
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
                  <p style={{ marginBottom: "0.5rem" }}>{venue.description}</p>
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
                <button
                  className="ui-btn secondary"
                  onClick={() => handleEdit(venue)}
                  style={{ padding: "0.5rem" }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="ui-btn danger"
                  onClick={() => handleDelete(venue._id)}
                  style={{ padding: "0.5rem" }}
                >
                  <Trash2 size={16} />
                </button>
                <Link
                  to={`/venues/${venue._id}/book`}
                  className="ui-btn primary"
                  style={{ padding: "0.5rem" }}
                >
                  <Calendar size={16} />
                </Link>
                <Link
                  to={`/venues/${venue._id}/stats`}
                  className="ui-btn secondary"
                  style={{ padding: "0.5rem" }}
                >
                  <BarChart2 size={16} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default VenueManagement;
