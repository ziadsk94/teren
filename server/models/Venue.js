import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  date: { type: String, required: true },
  startTime: { type: String, required: true }, // e.g., "18:00"
  endTime: { type: String, required: true }, // e.g., "19:00"
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null if external
  external: { type: Boolean, default: false },
});

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: { type: String, required: true }, // e.g., Craiova
  description: { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  contactInfo: {
    phone: { type: String },
    email: { type: String },
    website: { type: String },
  },
  facilities: [String], // e.g., ["Parking", "Showers", "Changing Rooms"]
  surfaceType: { type: String }, // e.g., "Grass", "Artificial Turf", "Concrete"
  size: { type: String }, // e.g., "Full Size", "Half Size"
  bookings: [bookingSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  price: {
    type: Number, // or String if you want to support ranges or text
    required: false,
    default: 0,
  },
  currency: {
    type: String,
    default: "RON", // or "EUR", "USD", etc.
  },
});

// Create indexes for common queries
venueSchema.index({ createdBy: 1 });
venueSchema.index({ location: 1 });
venueSchema.index({ surfaceType: 1 });
venueSchema.index({ size: 1 });
venueSchema.index({ "bookings.date": 1 });

// Update the updatedAt timestamp before saving
venueSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Venue = mongoose.model("Venue", venueSchema);

export default Venue;
