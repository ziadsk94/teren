import nodemailer from "nodemailer";

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email templates
export const templates = {
  bookingConfirmation: (booking, venue, language) => ({
    subject:
      language === "ro"
        ? `Confirmare rezervare - ${venue.name}`
        : `Booking Confirmation - ${venue.name}`,
    html:
      language === "ro"
        ? `
        <h2>Rezervarea ta a fost confirmată!</h2>
        <p>Detalii rezervare:</p>
        <ul>
          <li>Teren: ${venue.name}</li>
          <li>Data: ${booking.date}</li>
          <li>Ora: ${booking.startTime} - ${booking.endTime}</li>
          <li>Adresă: ${venue.address}, ${venue.location}</li>
        </ul>
        <p>Te așteptăm!</p>
      `
        : `
        <h2>Your booking has been confirmed!</h2>
        <p>Booking details:</p>
        <ul>
          <li>Venue: ${venue.name}</li>
          <li>Date: ${booking.date}</li>
          <li>Time: ${booking.startTime} - ${booking.endTime}</li>
          <li>Address: ${venue.address}, ${venue.location}</li>
        </ul>
        <p>We look forward to seeing you!</p>
      `,
  }),

  bookingReminder: (booking, venue, language) => ({
    subject:
      language === "ro"
        ? `Reminder rezervare - ${venue.name}`
        : `Booking Reminder - ${venue.name}`,
    html:
      language === "ro"
        ? `
        <h2>Reminder rezervare</h2>
        <p>Ai o rezervare mâine:</p>
        <ul>
          <li>Teren: ${venue.name}</li>
          <li>Data: ${booking.date}</li>
          <li>Ora: ${booking.startTime} - ${booking.endTime}</li>
          <li>Adresă: ${venue.address}, ${venue.location}</li>
        </ul>
        <p>Te așteptăm!</p>
      `
        : `
        <h2>Booking Reminder</h2>
        <p>You have a booking tomorrow:</p>
        <ul>
          <li>Venue: ${venue.name}</li>
          <li>Date: ${booking.date}</li>
          <li>Time: ${booking.startTime} - ${booking.endTime}</li>
          <li>Address: ${venue.address}, ${venue.location}</li>
        </ul>
        <p>We look forward to seeing you!</p>
      `,
  }),

  bookingCancellation: (booking, venue, language) => ({
    subject:
      language === "ro"
        ? `Anulare rezervare - ${venue.name}`
        : `Booking Cancellation - ${venue.name}`,
    html:
      language === "ro"
        ? `
        <h2>Rezervarea ta a fost anulată</h2>
        <p>Detalii rezervare anulată:</p>
        <ul>
          <li>Teren: ${venue.name}</li>
          <li>Data: ${booking.date}</li>
          <li>Ora: ${booking.startTime} - ${booking.endTime}</li>
          <li>Adresă: ${venue.address}, ${venue.location}</li>
        </ul>
        <p>Pentru mai multe informații, te rugăm să ne contactezi.</p>
      `
        : `
        <h2>Your booking has been cancelled</h2>
        <p>Cancelled booking details:</p>
        <ul>
          <li>Venue: ${venue.name}</li>
          <li>Date: ${booking.date}</li>
          <li>Time: ${booking.startTime} - ${booking.endTime}</li>
          <li>Address: ${venue.address}, ${venue.location}</li>
        </ul>
        <p>Please contact us for more information.</p>
      `,
  }),

  newBookingNotification: (booking, venue, language) => ({
    subject:
      language === "ro"
        ? `Nouă rezervare - ${venue.name}`
        : `New Booking - ${venue.name}`,
    html:
      language === "ro"
        ? `
        <h2>Nouă rezervare</h2>
        <p>Detalii rezervare:</p>
        <ul>
          <li>Teren: ${venue.name}</li>
          <li>Data: ${booking.date}</li>
          <li>Ora: ${booking.startTime} - ${booking.endTime}</li>
          <li>Adresă: ${venue.address}, ${venue.location}</li>
        </ul>
      `
        : `
        <h2>New Booking</h2>
        <p>Booking details:</p>
        <ul>
          <li>Venue: ${venue.name}</li>
          <li>Date: ${booking.date}</li>
          <li>Time: ${booking.startTime} - ${booking.endTime}</li>
          <li>Address: ${venue.address}, ${venue.location}</li>
        </ul>
      `,
  }),
};

// Send email function
export const sendEmail = async (to, template, data) => {
  try {
    const { subject, html } = templates[template](
      data.booking,
      data.venue,
      data.language
    );

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};
