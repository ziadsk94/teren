const cron = require("node-cron");
const Venue = require("../models/Venue");
const User = require("../models/User");
const { sendEmail } = require("./emailService");

// Function to send reminders for tomorrow's bookings
const sendBookingReminders = async () => {
  try {
    // Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Find all venues with bookings for tomorrow
    const venues = await Venue.find({
      "bookings.date": tomorrowStr,
    });

    for (const venue of venues) {
      // Get tomorrow's bookings
      const tomorrowBookings = venue.bookings.filter(
        (booking) => booking.date === tomorrowStr
      );

      for (const booking of tomorrowBookings) {
        // Skip external bookings
        if (booking.external) continue;

        // Get the user who made the booking
        const user = await User.findById(booking.bookedBy);
        if (!user) continue;

        // Send reminder email
        await sendEmail(user.email, "bookingReminder", {
          booking,
          venue,
          language: user.language || "ro",
        });
      }
    }
  } catch (error) {
    console.error("Error sending booking reminders:", error);
  }
};

// Schedule the reminder task to run every day at 8:00 AM
const startScheduler = () => {
  cron.schedule("0 8 * * *", sendBookingReminders);
  console.log("Booking reminder scheduler started");
};

module.exports = {
  startScheduler,
};
