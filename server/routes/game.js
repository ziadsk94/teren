import express from "express";
import Game from "../models/Game.js";
import Venue from "../models/Venue.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const router = express.Router();

// Middleware to check user
const isUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Get all games (optionally filter by location, date, skillLevel)
router.get("/", async (req, res) => {
  const { location, date, skillLevel } = req.query;
  let filter = {};
  if (location) filter["venue.location"] = location;
  if (date) filter.date = date;
  if (skillLevel) filter.skillLevel = skillLevel;

  try {
    // Fetch games and populate venue
    const games = await Game.find(filter).populate("venue");

    // Manually process players for each game
    const gamesWithProcessedPlayers = await Promise.all(
      games.map(async (game) => {
        // Store the original players array and its length
        const originalPlayers = [...game.players];
        const totalPlayersCount = originalPlayers.length;

        // Separate ObjectIds (real users) from anonymous strings
        const playerObjectIds = originalPlayers.filter((player) =>
          mongoose.Types.ObjectId.isValid(player)
        );
        const anonymousPlayers = originalPlayers.filter(
          (player) => !mongoose.Types.ObjectId.isValid(player)
        );

        // Populate only the real users
        const populatedUsers = await mongoose
          .model("User")
          .find({ _id: { $in: playerObjectIds } })
          .select("name");

        // Reconstruct the players array for the response: populated users + anonymous strings
        // Ensure the order is somewhat preserved if necessary, but typically just combining is fine.
        // We'll add populated users first, then anonymous strings.
        const processedPlayers = populatedUsers
          .map((user) => user.toObject())
          .concat(anonymousPlayers);

        // Return the game object with the processed players array and total count
        return {
          ...game.toObject(), // Convert Mongoose document to plain object
          players: processedPlayers,
          totalPlayersCount: totalPlayersCount,
        };
      })
    );

    res.json(gamesWithProcessedPlayers);
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({ message: "Error fetching games" });
  }
});

// Create a new game
router.post("/", isUser, async (req, res) => {
  try {
    const {
      date,
      startTime,
      endTime,
      venue,
      maxPlayers,
      skillLevel,
      notes,
      preFilledPlayers = 0,
    } = req.body;

    // Validate preFilledPlayers
    if (preFilledPlayers < 0 || preFilledPlayers >= maxPlayers) {
      return res.status(400).json({
        message: "Pre-filled players must be between 0 and maxPlayers-1",
      });
    }

    const game = new Game({
      date,
      startTime,
      endTime,
      venue,
      maxPlayers,
      skillLevel,
      notes,
      createdBy: req.userId,
      // Construct the players array with the creator and anonymous players
      players: [req.userId].concat(
        Array.from(
          { length: preFilledPlayers },
          (_, i) => `anonymous_${Date.now()}_${i}`
        )
      ),
    });

    await game.save();

    // Create a booking entry in the venue
    const venueDoc = await Venue.findById(venue);
    if (venueDoc) {
      venueDoc.bookings.push({
        date,
        startTime,
        endTime,
        game: game._id,
        type: "game",
        bookedBy: req.userId,
        external: false,
      });
      await venueDoc.save();
    }

    res.status(201).json(game);
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ message: "Error creating game" });
  }
});

// Join a game
router.post("/:gameId/join", isUser, async (req, res) => {
  console.log(
    "Attempting to join game with ID:",
    req.params.gameId,
    "for user:",
    req.userId
  );
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      console.log(
        "Join game failed: Game not found for ID:",
        req.params.gameId
      );
      return res.status(404).json({ error: "Game not found" });
    }
    console.log("Game before joining:", game);
    if (game.players.length >= game.maxPlayers) {
      console.log("Join game failed: Game is full.");
      return res.status(400).json({ error: "Game is full" });
    }
    // Check if player is already in the game (compare IDs as strings)
    if (
      game.players.some((player) => player.toString() === req.userId.toString())
    ) {
      console.log("Join game failed: Already joined.");
      return res.status(400).json({ error: "Already joined" });
    }
    game.players.push(req.userId);
    console.log("Game after attempting to push player:", game);
    await game.save();
    console.log("Game successfully joined and saved.");
    res.json(game);
  } catch (err) {
    console.error("Error joining game:", err);
    res.status(400).json({ error: err.message });
  }
});

// Leave a game
router.post("/:gameId/leave", isUser, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).json({ error: "Game not found" });
    const idx = game.players.indexOf(req.userId);
    if (idx === -1)
      return res.status(400).json({ error: "You are not in this game" });
    game.players.splice(idx, 1);
    await game.save();
    res.json(game);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit a game (only by creator)
router.put("/:gameId", isUser, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).json({ error: "Game not found" });
    if (!game.createdBy || game.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const {
      date,
      startTime,
      endTime,
      venue,
      maxPlayers,
      skillLevel,
      notes,
      preFilledPlayers,
    } = req.body;

    // Update simple fields
    game.date = date !== undefined ? date : game.date;
    game.startTime = startTime !== undefined ? startTime : game.startTime;
    game.endTime = endTime !== undefined ? endTime : game.endTime;
    game.venue = venue !== undefined ? venue : game.venue;
    game.maxPlayers = maxPlayers !== undefined ? maxPlayers : game.maxPlayers;
    game.skillLevel = skillLevel !== undefined ? skillLevel : game.skillLevel;
    game.notes = notes !== undefined ? notes : game.notes;

    // Handle preFilledPlayers update
    if (preFilledPlayers !== undefined) {
      // Validate new preFilledPlayers count
      if (
        preFilledPlayers < 0 ||
        preFilledPlayers >
          game.maxPlayers -
            game.players.filter((player) =>
              mongoose.Types.ObjectId.isValid(player)
            ).length
      ) {
        return res
          .status(400)
          .json({ message: "Invalid pre-filled players count" });
      }

      // Separate real players (ObjectIds) and existing anonymous players (strings)
      const realPlayers = game.players.filter((player) =>
        mongoose.Types.ObjectId.isValid(player)
      );

      // Construct the new players array: real players + updated number of anonymous players
      game.players = realPlayers.concat(
        Array.from(
          { length: preFilledPlayers },
          (_, i) => `anonymous_${Date.now()}_${i}`
        )
      );
    }

    await game.save();

    // Fetch and return the updated game with correct totalPlayersCount
    const updatedGame = await Game.findById(game._id)
      .populate("venue") // Populate venue
      .populate("createdBy", "name email"); // Populate createdBy

    // Get the total count of players from the unpopulated array of the updated game
    const totalPlayers = updatedGame.players.length;

    // Manually process players for the response
    const playerObjectIds = updatedGame.players.filter((player) =>
      mongoose.Types.ObjectId.isValid(player)
    );
    const anonymousPlayers = updatedGame.players.filter(
      (player) => !mongoose.Types.ObjectId.isValid(player)
    );

    const populatedUsers = await mongoose
      .model("User")
      .find({ _id: { $in: playerObjectIds } })
      .select("name");

    const processedPlayers = populatedUsers
      .map((user) => user.toObject())
      .concat(anonymousPlayers);

    const gameWithTotalCount = {
      ...updatedGame.toObject(),
      players: processedPlayers,
      totalPlayersCount: totalPlayers,
    };

    res.json(gameWithTotalCount);
  } catch (err) {
    console.error("Error editing game:", err);
    res.status(400).json({ error: err.message });
  }
});

// Delete a game (only by creator)
router.delete("/:gameId", isUser, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).json({ error: "Game not found" });
    if (!game.createdBy || game.createdBy.toString() !== req.userId)
      return res.status(403).json({ error: "Not authorized" });

    // Also remove the corresponding booking from the venue
    const venue = await Venue.findById(game.venue);
    if (venue) {
      // Find the booking associated with this game
      // Assuming the booking date, time, and bookedBy match the game details
      // A more robust solution would be to store the booking ID on the game or vice versa
      const bookingIndex = venue.bookings.findIndex(
        (booking) =>
          booking.date === game.date &&
          booking.startTime === game.startTime &&
          booking.endTime === game.endTime &&
          booking.bookedBy &&
          booking.bookedBy.toString() === game.createdBy.toString() &&
          booking.external === false
      );

      if (bookingIndex !== -1) {
        venue.bookings.splice(bookingIndex, 1);
        await venue.save();
        console.log(
          `Removed booking for game ${game._id} from venue ${venue._id}`
        );
      } else {
        console.warn(
          `Could not find booking for game ${game._id} in venue ${venue._id}`
        );
      }
    }

    await game.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting game and booking:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get a single game by ID
router.get("/:gameId", async (req, res) => {
  try {
    console.log(
      `[Backend /api/games/:gameId] Fetching raw game ${req.params.gameId}...`
    );
    // Step 1: Fetch the game without any population to get the true players array length
    const rawGame = await Game.findById(req.params.gameId);

    if (!rawGame) {
      console.log(
        `[Backend /api/games/:gameId] Game ${req.params.gameId} not found.`
      );
      return res.status(404).json({ error: "Game not found" });
    }

    console.log(
      `[Backend /api/games/:gameId] Raw game fetched. Players array:`,
      rawGame.players
    );

    // Get the total count of players from the unpopulated array
    const totalPlayers = rawGame.players.length;
    console.log(
      `[Backend /api/games/:gameId] Calculated totalPlayers: ${totalPlayers}`
    );

    // Separate ObjectIds (real users) from anonymous strings from the raw game players array
    const playerObjectIds = rawGame.players.filter((player) =>
      mongoose.Types.ObjectId.isValid(player)
    );
    const anonymousPlayers = rawGame.players.filter(
      (player) => !mongoose.Types.ObjectId.isValid(player)
    );

    console.log(
      `[Backend /api/games/:gameId] Populating only valid ObjectIds:`,
      playerObjectIds
    );
    // Populate only the real users (valid ObjectIds)
    const populatedUsers = await mongoose
      .model("User")
      .find({ _id: { $in: playerObjectIds } })
      .select("name");
    console.log(
      `[Backend /api/games/:gameId] Populated users:`,
      populatedUsers
    );

    // Reconstruct the players array for the response: populated users + anonymous strings
    // Ensure the order is somewhat preserved if necessary, but typically just combining is fine.
    const processedPlayers = populatedUsers
      .map((user) => user.toObject())
      .concat(anonymousPlayers);
    console.log(
      `[Backend /api/games/:gameId] Processed players array for response:`,
      processedPlayers
    );

    // Step 2: Fetch the game again, just to populate venue and createdBy
    const game = await Game.findById(req.params.gameId)
      .populate("venue") // Populate venue
      .populate("createdBy", "name email"); // Populate createdBy

    // Return the game data with the manually processed players array and the correct total count
    const gameWithTotalCount = {
      ...game.toObject(), // Convert Mongoose document to plain object
      players: processedPlayers, // Use the manually processed players array
      totalPlayersCount: totalPlayers, // Use the totalPlayers count from the raw fetch
    };

    console.log(
      "[Backend /api/games/:gameId] Final response object:",
      gameWithTotalCount
    );

    res.json(gameWithTotalCount);
  } catch (err) {
    console.error(
      "[Backend /api/games/:gameId] Error fetching single game:",
      err
    );
    res.status(400).json({ error: err.message });
  }
});

export default router;
