import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Venue",
    required: false,
  }, // not required
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  players: [
    {
      type: mongoose.Schema.Types.Mixed,
      ref: "User", // Keep ref for actual User ObjectIds
    },
  ],
  maxPlayers: { type: Number, required: true },
  skillLevel: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  location: { type: String }, // for games without a venue
  notes: { type: String },
});

const Game = mongoose.model("Game", gameSchema);

export default Game;
