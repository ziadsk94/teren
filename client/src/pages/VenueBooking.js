import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, MapPin, X } from "lucide-react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
  "ro-RO": require("date-fns/locale/ro"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const VenueBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState(60); // in minutes
  const [bookings, setBookings] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({
    date: "",
    startTime: "",
    duration: 60,
  });
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchVenue = async () => {
    try {
      const res = await fetch(`/api/venues/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        // Check for 404 specifically
        if (res.status === 404) {
          throw new Error(t("venue.booking.venue_not_found"));
        } else {
          throw new Error(t("venue.management.error_fetch"));
        }
      }
      const data = await res.json();
      console.log("Fetched venue data:", data);
      setVenue(data);
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || t("venue.management.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    console.log("Venue ID from URL params:", id);
    setIsAdmin(user?.admin || false);
    fetchVenue();
  }, [id, token, user, navigate]);

  const calendarEvents = useMemo(() => {
    console.log("Current bookings for memo:", bookings);
    // Filter out bookings not made by a user for calendar display
    return bookings
      .filter((booking) => !booking.external && booking.bookedBy)
      .map((booking) => {
        // Ensure the date is in YYYY-MM-DD format
        const [year, month, day] = booking.date.split("-").map(Number);
        const [startHour, startMinute] = booking.startTime
          .split(":")
          .map(Number);
        const [endHour, endMinute] = booking.endTime.split(":").map(Number);

        const start = new Date(year, month - 1, day, startHour, startMinute);
        const end = new Date(year, month - 1, day, endHour, endMinute);

        let eventTitle = t("venue.booking.booked");
        if (booking.external) {
          eventTitle = t("venue.booking.external_booking");
        } else if (booking.bookedBy) {
          eventTitle = t("venue.booking.user_booking");
        } else {
          // This case shouldn't ideally happen based on model, but as a fallback:
          eventTitle = t("venue.booking.unassigned_booking");
        }

        console.log("Converting booking:", booking, "to event:", {
          start,
          end,
          title: eventTitle,
        });
        return {
          id: booking._id,
          title: eventTitle,
          start,
          end,
          resource: booking,
        };
      });
  }, [bookings, t]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedTime("");
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const handleDurationChange = (e) => {
    setDuration(Number(e.target.value));
  };

  const isTimeSlotAvailable = (date, startTime, duration) => {
    const endTime = new Date(
      new Date(`${date}T${startTime}`).getTime() + duration * 60000
    );
    const endTimeStr = endTime.toTimeString().slice(0, 5);

    return !bookings.some((booking) => {
      if (booking.date !== date) return false;
      const bookingStart = new Date(`${date}T${booking.startTime}`);
      const bookingEnd = new Date(`${date}T${booking.endTime}`);
      const slotStart = new Date(`${date}T${startTime}`);
      const slotEnd = new Date(`${date}T${endTimeStr}`);

      return (
        (slotStart >= bookingStart && slotStart < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (slotStart <= bookingStart && slotEnd >= bookingEnd)
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      toast.error(t("venue.booking.select_date_time"));
      return;
    }

    const endTime = new Date(
      new Date(`${selectedDate}T${selectedTime}`).getTime() + duration * 60000
    );
    const endTimeStr = endTime.toTimeString().slice(0, 5);

    if (!isTimeSlotAvailable(selectedDate, selectedTime, duration)) {
      toast.error(t("venue.booking.already_booked"));
      return;
    }

    try {
      const res = await fetch(`/api/venues/${id}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          startTime: selectedTime,
          endTime: endTimeStr,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("venue.booking.error_book"));
      }

      toast.success(t("venue.booking.book_success"));
      fetchVenue();
      setSelectedDate("");
      setSelectedTime("");
    } catch (err) {
      toast.error(err.message || t("venue.management.error"));
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!isAdmin) {
      toast.error(t("venue.booking.no_permission_delete"));
      return;
    }

    if (!window.confirm(t("venue.booking.delete_confirmation"))) {
      return;
    }

    try {
      const res = await fetch(`/api/venues/${id}/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("venue.booking.error_delete"));
      }

      toast.success(t("venue.booking.delete_success"));
      fetchVenue();
    } catch (err) {
      toast.error(err.message || t("venue.management.error"));
    }
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setEditForm({
      date: booking.date,
      startTime: booking.startTime.slice(0, 5),
      duration:
        (new Date(`1970-01-01T${booking.endTime}`).getTime() -
          new Date(`1970-01-01T${booking.startTime}`).getTime()) /
        60000,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error(t("venue.booking.no_permission_edit"));
      return;
    }

    const endTime = new Date(
      new Date(`${editForm.date}T${editForm.startTime}`).getTime() +
        editForm.duration * 60000
    );
    const endTimeStr = endTime.toTimeString().slice(0, 5);

    // Check if the new time slot is available (excluding the current booking)
    const hasOverlap = bookings.some((booking) => {
      if (booking._id === editingBooking._id) return false;
      if (booking.date !== editForm.date) return false;
      const bookingStart = new Date(`${editForm.date}T${booking.startTime}`);
      const bookingEnd = new Date(`${editForm.date}T${booking.endTime}`);
      const newStart = new Date(`${editForm.date}T${editForm.startTime}`);
      const newEnd = new Date(`${editForm.date}T${endTimeStr}`);

      return (
        (newStart >= bookingStart && newStart < bookingEnd) ||
        (newEnd > bookingStart && newEnd <= bookingEnd) ||
        (newStart <= bookingStart && newEnd >= bookingEnd)
      );
    });

    if (hasOverlap) {
      toast.error(t("venue.booking.overlap_error"));
      return;
    }

    try {
      const res = await fetch(
        `/api/venues/${id}/bookings/${editingBooking._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: editForm.date,
            startTime: editForm.startTime,
            endTime: endTimeStr,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("venue.booking.error_update"));
      }

      toast.success(t("venue.booking.update_success"));
      setShowEditModal(false);
      fetchVenue();
    } catch (err) {
      toast.error(err.message || t("venue.management.error"));
    }
  };

  function generateTimeOptions(start = 6, end = 22) {
    const options = [];
    for (let h = start; h <= end; h++) {
      options.push(
        `${h.toString().padStart(2, "0")}:00`,
        `${h.toString().padStart(2, "0")}:30`
      );
    }
    // Remove the last :30 if end is a whole hour (e.g., 22:30 should not be included)
    if (
      options[options.length - 1] === `${end.toString().padStart(2, "0")}:30`
    ) {
      options.pop();
    }
    return options;
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        {t("venue.management.loading")}
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <h2>{t("venue.booking.venue_not_found")}</h2>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h1 className="ui-heading" style={{ marginBottom: "1rem" }}>
          {venue.name}
        </h1>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={18} /> {venue.address}, {venue.location}
          </span>
        </div>

        <div style={{ height: 600, marginBottom: "2rem" }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            views={["month", "week", "day"]}
            defaultView="week"
            min={new Date(0, 0, 0, 6, 0, 0)}
            max={new Date(0, 0, 0, 22, 0, 0)}
            messages={{
              next: t("venue.booking.calendar.next"),
              previous: t("venue.booking.calendar.previous"),
              today: t("venue.booking.calendar.today"),
              month: t("venue.booking.calendar.month"),
              week: t("venue.booking.calendar.week"),
              day: t("venue.booking.calendar.day"),
            }}
            components={{
              event: ({ event }) => (
                <div style={{ position: "relative", height: "100%" }}>
                  <div style={{ padding: "2px 4px" }}>{event.title}</div>
                </div>
              ),
            }}
          />
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label className="small">
              <CalendarIcon size={16} style={{ marginRight: 6 }} />
              {t("venue.booking.date")} *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split("T")[0]}
              required
              style={{ width: "100%", marginTop: 4 }}
            />
          </div>

          <div>
            <label className="small">
              <Clock size={16} style={{ marginRight: 6 }} />
              {t("venue.booking.start_time")} *
            </label>
            <select
              value={selectedTime}
              onChange={handleTimeChange}
              required
              style={{
                width: "100%",
                marginTop: 4,
                padding: "0.75rem 1rem",
                borderRadius: 8,
                border: "1px solid var(--light-gray)",
                fontSize: "1rem",
                background: "white",
              }}
            >
              <option value="">--:--</option>
              {generateTimeOptions().map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="small">
              <Clock size={16} style={{ marginRight: 6 }} />
              {t("venue.booking.duration")} *
            </label>
            <select
              value={duration}
              onChange={handleDurationChange}
              style={{ width: "100%", marginTop: 4 }}
            >
              <option value={60}>1 {t("venue.booking.hour")}</option>
              <option value={90}>1.5 {t("venue.booking.hours")}</option>
              <option value={120}>2 {t("venue.booking.hours")}</option>
            </select>
          </div>

          <button
            type="submit"
            className="ui-btn primary"
            style={{ marginTop: "1rem" }}
          >
            {t("venue.booking.book")}
          </button>
        </form>
      </div>

      {showEditModal && editingBooking && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 500,
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowEditModal(false)}
              style={{
                position: "absolute",
                right: 16,
                top: 16,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: "1.5rem" }}>
              {t("venue.booking.edit")}
            </h2>
            <form
              onSubmit={handleEditSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label className="small">
                  <CalendarIcon size={16} style={{ marginRight: 6 }} />
                  {t("venue.booking.date")} *
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                  style={{ width: "100%", marginTop: 4 }}
                />
              </div>

              <div>
                <label className="small">
                  <Clock size={16} style={{ marginRight: 6 }} />
                  {t("venue.booking.start_time")} *
                </label>
                <select
                  value={editForm.startTime}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                  required
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: "0.75rem 1rem",
                    borderRadius: 8,
                    border: "1px solid var(--light-gray)",
                    fontSize: "1rem",
                    background: "white",
                  }}
                >
                  <option value="">--:--</option>
                  {generateTimeOptions().map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small">
                  <Clock size={16} style={{ marginRight: 6 }} />
                  {t("venue.booking.duration")} *
                </label>
                <select
                  value={editForm.duration}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      duration: Number(e.target.value),
                    }))
                  }
                  style={{ width: "100%", marginTop: 4 }}
                >
                  <option value={60}>1 {t("venue.booking.hour")}</option>
                  <option value={90}>1.5 {t("venue.booking.hours")}</option>
                  <option value={120}>2 {t("venue.booking.hours")}</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" className="ui-btn primary">
                  {t("venue.booking.save")}
                </button>
                <button
                  type="button"
                  className="ui-btn secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  {t("venue.booking.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: "1rem" }}>
          {t("venue.booking.existing_bookings")}
        </h2>
        {bookings.length === 0 ? (
          <p style={{ color: "var(--mid-gray)" }}>
            {t("venue.booking.no_bookings")}
          </p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {bookings
              .filter((booking) => !booking.external && booking.bookedBy)
              .map((booking, index) => (
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
                      <CalendarIcon size={16} />
                      <span>{booking.date}</span>
                      <Clock size={16} />
                      <span>
                        {booking.startTime} - {booking.endTime}
                      </span>
                    </div>
                    {isAdmin && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => handleEditBooking(booking)}
                          className="ui-btn secondary"
                          style={{ padding: "0.5rem" }}
                        >
                          {t("venue.booking.edit")}
                        </button>
                        {!booking.external && (
                          <button
                            onClick={() => handleDeleteBooking(booking._id)}
                            className="ui-btn danger"
                            style={{ padding: "0.5rem" }}
                          >
                            {t("venue.booking.delete")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default VenueBooking;
