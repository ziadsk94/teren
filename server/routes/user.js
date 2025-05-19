import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Game from "../models/Game.js";

const router = express.Router();

// Middleware to check user (copied from game.js)
function isUser(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// Register
router.post("/register", async (req, res) => {
  try {
    const {
      name: userName,
      email: userEmail,
      username: userUsername,
      password: userPassword,
      location: userLocation,
    } = req.body;
    const user = new User({
      name: userName,
      email: userEmail,
      username: userUsername,
      password: userPassword,
      location: userLocation,
    });
    await user.save();
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    if (err.code === 11000) {
      // Handle duplicate key error
      const field = Object.keys(err.keyPattern)[0];
      res.status(400).json({
        error: `${field} already exists. Please choose a different ${field}.`,
      });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// Login
console.log("Setting up /login route");
router.post(
  "/login",
  (req, res, next) => {
    console.log("Received login request");
    console.log("Request body:", req.body);
    next();
  },
  async (req, res) => {
    console.log("Inside login handler");
    try {
      const { email, password } = req.body;
      console.log("Email:", email, "Password:", password);
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign(
        { id: user._id, admin: user.admin },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          location: user.location,
          admin: user.admin,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(400).json({ error: err.message });
    }
  }
);

// Get games joined by the logged-in user
router.get("/me/games", isUser, async (req, res) => {
  try {
    console.log(`Fetching games for user ID: ${req.userId}`);
    // Find games where the players array contains the user's ObjectId
    const games = await Game.find({ players: { $in: [req.userId] } })
      .populate("venue") // Populate venue details
      .populate("createdBy", "name email"); // Populate creator details

    console.log("Fetched user games:", games);

    // Manually process players for each game to include anonymous ones and total count
    const gamesWithProcessedPlayers = await Promise.all(
      games.map(async (game) => {
        const originalPlayers = [...game.players];
        const totalPlayersCount = originalPlayers.length;

        const playerObjectIds = originalPlayers.filter((player) =>
          mongoose.Types.ObjectId.isValid(player)
        );
        const anonymousPlayers = originalPlayers.filter(
          (player) => !mongoose.Types.ObjectId.isValid(player)
        );

        const populatedUsers = await mongoose
          .model("User")
          .find({ _id: { $in: playerObjectIds } })
          .select("name");

        const processedPlayers = populatedUsers
          .map((user) => user.toObject())
          .concat(anonymousPlayers);

        return {
          ...game.toObject(),
          players: processedPlayers,
          totalPlayersCount: totalPlayersCount,
        };
      })
    );

    res.json(gamesWithProcessedPlayers);
  } catch (error) {
    console.error("Error fetching user games:", error);
    res.status(500).json({ message: "Error fetching user games" });
  }
});

export default router;
