// server/index.js
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import userRoutes from "./routes/user.js";
import venueRoutes from "./routes/venue.js";
import gameRoutes from "./routes/game.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();
const app = express();
app.use(cors());

console.log("Applying express.json() middleware...");
app.use(express.json());
console.log("express.json() middleware applied.");

app.use("/api/users", userRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/admin", adminRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  )
  .catch((err) => console.error(err));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}
