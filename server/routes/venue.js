import express from "express";
import Venue from "../models/Venue.js";
import { protect } from "../middleware/authMiddleware.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/emailService.js";
import User from "../models/User.js";

const router = express.Router();

// Middleware to check admin and attach adminId to request
function isAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  // Allow GET requests to /venues, /venues/:id, and /venues/:venueId/bookings
  // for authenticated users (admin or not) and unauthenticated users for GET /
  if (
    req.method === "GET" &&
    (req.path === "/" ||
      /^\/[a-f0-9]{24}$/i.test(req.path) || // Matches /:id (assuming MongoDB ObjectId format)
      /^\/[a-f0-9]{24}\/bookings$/i.test(req.path)) // Matches /:venueId/bookings
  ) {
    if (!token) {
      // Allow unauthenticated access only to GET /
      if (req.path === "/") {
        req.isAdminUser = false;
        return next();
      } else {
        // For /:id and /:venueId/bookings, require authentication
        return res.status(401).json({ error: "Authentication required" });
      }
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id; // Store user ID
      req.isAdminUser = decoded.admin || false; // Store admin status
      return next(); // Authenticated, proceed for allowed GET routes
    } catch (err) {
      // Invalid token for allowed GET routes
      console.error("Invalid token for GET request:", err.message);
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  // For all other routes (POST, PUT, DELETE, or other paths), require admin
  if (!token) {
    return res.status(401).json({ error: "No token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.admin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.adminId = decoded.id; // Store admin ID
    req.isAdminUser = true;
    next(); // Admin, proceed for restricted routes
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// Apply isAdmin middleware to all routes
router.use(isAdmin);

// Get all venues (with optional filters)
// Admins only see venues they created
router.get("/", async (req, res) => {
  try {
    const { location, surfaceType, size } = req.query;
    let filter = {};

    if (location) filter.location = location;
    if (surfaceType) filter.surfaceType = surfaceType;
    if (size) filter.size = size;

    // If the user is an admin, add a filter to only show venues they created
    if (req.isAdminUser) {
      filter.createdBy = req.userId;
    }

    const venues = await Venue.find(filter).sort({ name: 1 });
    res.json(venues);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get a single venue by ID
// No ownership check here, anyone can view a venue's details
router.get("/:id", async (req, res) => {
  console.log("Attempting to fetch venue with ID:", req.params.id);
  console.log("Authorization Header:", req.headers.authorization);
  try {
    // The isAdmin middleware has already run before this handler.
    // If it reached here for a GET /:id request without a valid token, it means
    // the middleware logic might need adjustment if we intend this route to be public.
    // For now, let's assume a token is expected or the middleware handles it.
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      console.log("Venue not found for ID:", req.params.id);
      return res.status(404).json({ error: "Venue not found" });
    }
    console.log("Successfully fetched venue:", venue.name);
    res.json(venue);
  } catch (err) {
    console.error(
      "Error fetching venue with ID:",
      req.params.id,
      ":",
      err.message
    );
    res.status(400).json({ error: err.message });
  }
});

// Add a new venue (admin only)
router.post("/", async (req, res) => {
  // isAdmin middleware already ran and set req.adminId and req.isAdminUser
  if (!req.isAdminUser) return res.status(403).json({ error: "Forbidden" });

  try {
    const {
      name,
      address,
      location,
      description,
      coordinates,
      contactInfo,
      facilities,
      surfaceType,
      size,
    } = req.body;

    const venueData = {
      name,
      address,
      location,
      description,
      contactInfo,
      facilities,
      surfaceType,
      size,
      createdBy: req.adminId, // Set createdBy to the logged-in admin's ID
    };

    // Only include coordinates if both lat and lng are provided
    if (coordinates?.lat && coordinates?.lng) {
      venueData.coordinates = {
        lat: Number(coordinates.lat),
        lng: Number(coordinates.lng),
      };
    }

    const venue = new Venue(venueData);
    await venue.save();
    res.status(201).json(venue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a venue (admin only, with ownership check)
router.put("/:id", async (req, res) => {
  // isAdmin middleware already ran and set req.adminId and req.isAdminUser
  if (!req.isAdminUser) return res.status(403).json({ error: "Forbidden" });

  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    // Check if the logged-in admin is the creator of the venue
    if (venue.createdBy.toString() !== req.adminId) {
      return res
        .status(403)
        .json({ error: "You can only edit venues you created." });
    }

    const {
      name,
      address,
      location,
      description,
      coordinates,
      contactInfo,
      facilities,
      surfaceType,
      size,
      price,
      currency,
    } = req.body;

    // Update fields
    Object.assign(venue, {
      name,
      address,
      location,
      description,
      coordinates,
      contactInfo,
      facilities,
      surfaceType,
      size,
      price,
      currency,
    });

    await venue.save();
    res.json(venue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a venue (admin only, with ownership check)
router.delete("/:id", async (req, res) => {
  // isAdmin middleware already ran and set req.adminId and req.isAdminUser
  if (!req.isAdminUser) return res.status(403).json({ error: "Forbidden" });

  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    // Check if the logged-in admin is the creator of the venue
    if (venue.createdBy.toString() !== req.adminId) {
      return res
        .status(403)
        .json({ error: "You can only delete venues you created." });
    }

    await venue.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add external booking (admin only)
router.post("/:venueId/bookings", isAdmin, async (req, res) => {
  try {
    // Ownership check for adding external bookings
    const venue = await Venue.findById(req.params.venueId);
    if (!venue) return res.status(404).json({ error: "Venue not found" });
    if (venue.createdBy.toString() !== req.adminId) {
      return res
        .status(403)
        .json({ error: "You can only add bookings to venues you created." });
    }

    const { date, startTime, endTime } = req.body;

    // Validate date and time
    const bookingDate = new Date(date);
    const now = new Date();
    if (bookingDate < now.setHours(0, 0, 0, 0)) {
      return res.status(400).json({ error: "Cannot book for past dates" });
    }

    // Check for overlapping bookings
    const hasOverlap = venue.bookings.some((booking) => {
      if (booking.date !== date) return false;
      const bookingStart = new Date(`${date}T${booking.startTime}`);
      const bookingEnd = new Date(`${date}T${booking.endTime}`);
      const newStart = new Date(`${date}T${startTime}`);
      const newEnd = new Date(`${date}T${endTime}`);

      return (
        (newStart >= bookingStart && newStart < bookingEnd) ||
        (newEnd > bookingStart && newEnd <= bookingEnd) ||
        (newStart <= bookingStart && newEnd >= bookingEnd)
      );
    });

    if (hasOverlap) {
      return res
        .status(400)
        .json({ error: "Time slot overlaps with existing booking" });
    }

    const booking = {
      date,
      startTime,
      endTime,
      external: true,
      bookedBy: req.adminId,
    };

    venue.bookings.push(booking);
    await venue.save();

    // Send notification to all admins
    const admins = await User.find({ admin: true });
    const adminEmails = admins.map((admin) => admin.email);

    // Only send email if the admin who created the venue is different from the one adding the booking
    // Or if we want all admins to be notified of any external booking
    await sendEmail(adminEmails, "newBookingNotification", {
      booking,
      venue,
      language: "ro", // Default to Romanian, can be made dynamic based on admin preference
    });

    res.status(201).json(venue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get venue bookings
// No ownership check here, anyone can view a venue's bookings
router.get("/:venueId/bookings", async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.venueId);
    if (!venue) return res.status(404).json({ error: "Venue not found" });
    res.json(venue.bookings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a booking (admin only, with ownership check for the venue)
router.delete("/:venueId/bookings/:bookingId", isAdmin, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.venueId);
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    // Ownership check for deleting a booking within the venue
    if (venue.createdBy.toString() !== req.adminId) {
      return res.status(403).json({
        error: "You can only delete bookings from venues you created.",
      });
    }

    const bookingIndex = venue.bookings.findIndex(
      (b) => b._id.toString() === req.params.bookingId
    );
    if (bookingIndex === -1) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = venue.bookings[bookingIndex];
    venue.bookings.splice(bookingIndex, 1);
    await venue.save();

    // Send cancellation email if the booking was made by a user
    if (booking.bookedBy && !booking.external) {
      const user = await User.findById(booking.bookedBy);
      if (user) {
        await sendEmail(user.email, "bookingCancellation", {
          booking,
          venue,
          language: user.language || "ro",
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a booking (admin only, with ownership check for the venue)
router.put("/:venueId/bookings/:bookingId", isAdmin, async (req, res) => {
  try {
    // Ownership check for updating a booking within the venue
    const venue = await Venue.findById(req.params.venueId);
    if (!venue) return res.status(404).json({ error: "Venue not found" });
    if (venue.createdBy.toString() !== req.adminId) {
      return res
        .status(403)
        .json({ error: "You can only edit bookings from venues you created." });
    }

    const { date, startTime, endTime } = req.body;

    const bookingIndex = venue.bookings.findIndex(
      (b) => b._id.toString() === req.params.bookingId
    );
    if (bookingIndex === -1) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Validate date and time
    const bookingDate = new Date(date);
    const now = new Date();
    if (bookingDate < now.setHours(0, 0, 0, 0)) {
      return res.status(400).json({ error: "Cannot book for past dates" });
    }

    // Check for overlapping bookings (excluding the current booking)
    const hasOverlap = venue.bookings.some((booking, index) => {
      if (index === bookingIndex) return false;
      if (booking.date !== date) return false;
      const bookingStart = new Date(`${date}T${booking.startTime}`);
      const bookingEnd = new Date(`${date}T${booking.endTime}`);
      const newStart = new Date(`${date}T${startTime}`);
      const newEnd = new Date(`${date}T${endTime}`);

      return (
        (newStart >= bookingStart && newStart < bookingEnd) ||
        (newEnd > bookingStart && newEnd <= bookingEnd) ||
        (newStart <= bookingStart && newEnd >= bookingEnd)
      );
    });

    if (hasOverlap) {
      return res
        .status(400)
        .json({ error: "Time slot overlaps with existing booking" });
    }

    const oldBooking = venue.bookings[bookingIndex];
    const updatedBooking = {
      ...oldBooking,
      date,
      startTime,
      endTime,
    };

    venue.bookings[bookingIndex] = updatedBooking;
    await venue.save();

    // Send confirmation email if the booking was made by a user
    if (updatedBooking.bookedBy && !updatedBooking.external) {
      const user = await User.findById(updatedBooking.bookedBy);
      if (user) {
        await sendEmail(user.email, "bookingConfirmation", {
          booking: updatedBooking,
          venue,
          language: user.language || "ro",
        });
      }
    }

    res.json(venue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get booking statistics (admin only, with ownership check for the venue)
router.get("/:venueId/statistics", isAdmin, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.venueId);
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    // Ownership check for viewing statistics of a venue
    if (venue.createdBy.toString() !== req.adminId) {
      return res.status(403).json({
        error: "You can only view statistics for venues you created.",
      });
    }

    const { startDate, endDate } = req.query;
    let bookings = venue.bookings;

    // Filter bookings by date range if provided
    if (startDate && endDate) {
      bookings = bookings.filter(
        (booking) => booking.date >= startDate && booking.date <= endDate
      );
    }

    // Calculate statistics
    const stats = {
      totalBookings: bookings.length,
      externalBookings: bookings.filter((b) => b.external).length,
      userBookings: bookings.filter((b) => !b.external).length,
      bookingsByDay: {},
      bookingsByHour: {},
      averageDuration: 0,
      totalDuration: 0,
    };

    // Calculate bookings by day and hour
    bookings.forEach((booking) => {
      // Count by day
      stats.bookingsByDay[booking.date] =
        (stats.bookingsByDay[booking.date] || 0) + 1;

      // Count by hour
      const startHour = booking.startTime.split(":")[0];
      stats.bookingsByHour[startHour] =
        (stats.bookingsByHour[startHour] || 0) + 1;

      // Calculate duration
      const start = new Date(`2000-01-01T${booking.startTime}`);
      const end = new Date(`2000-01-01T${booking.endTime}`);
      const duration = (end - start) / (1000 * 60); // in minutes
      stats.totalDuration += duration;
    });

    // Calculate average duration
    stats.averageDuration =
      stats.totalBookings > 0
        ? Math.round(stats.totalDuration / stats.totalBookings)
        : 0;

    // Sort days and hours
    stats.bookingsByDay = Object.entries(stats.bookingsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    stats.bookingsByHour = Object.entries(stats.bookingsByHour)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    res.json(stats);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get booking history (admin only, with ownership check for the venue)
router.get("/:venueId/history", isAdmin, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.venueId);
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    // Ownership check for viewing history of a venue
    if (venue.createdBy.toString() !== req.adminId) {
      return res
        .status(403)
        .json({ error: "You can only view history for venues you created." });
    }

    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    let bookings = venue.bookings;

    // Filter bookings by date range if provided
    if (startDate && endDate) {
      bookings = bookings.filter(
        (booking) => booking.date >= startDate && booking.date <= endDate
      );
    }

    // Sort bookings by date and time (newest first)
    bookings.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.startTime.localeCompare(a.startTime);
    });

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedBookings = bookings.slice(startIndex, endIndex);

    // Get user details for each booking
    const bookingsWithDetails = await Promise.all(
      paginatedBookings.map(async (booking) => {
        const bookingObj = booking.toObject();
        if (!booking.external && booking.bookedBy) {
          const user = await User.findById(booking.bookedBy);
          if (user) {
            bookingObj.userDetails = {
              name: user.name,
              email: user.email,
            };
          }
        }
        return bookingObj;
      })
    );

    res.json({
      bookings: bookingsWithDetails,
      total: bookings.length,
      page: parseInt(page),
      totalPages: Math.ceil(bookings.length / limit),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
