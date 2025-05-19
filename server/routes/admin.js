import express from "express";
import User from "../models/User.js";
import Venue from "../models/Venue.js";
import { protect } from "../middleware/authMiddleware.js";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Admin login (credentials provided by website admin)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: admin._id, admin: true },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, admin: { id: admin._id, username: admin.username } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
