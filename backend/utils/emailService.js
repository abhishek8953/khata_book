import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/* ==========================================
   CREATE MAILJET TRANSPORTER
========================================== */
let transporter = null;

if (process.env.SMS_API_KEY && process.env.SMS_SECRET_KEY) {
  transporter = nodemailer.createTransport({
    host: "in-v3.mailjet.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMS_API_KEY,
      pass: process.env.SMS_SECRET_KEY,
    },
  });
}

/* ==========================================
   SEND EMAIL (SAME STYLE AS sendSMS)
========================================== */
const sendEmail = async (email, message) => {
  try {
    if (!transporter) {
      console.log(
        "Email Service not configured. Message would be sent to:",
        email,
        "Message:",
        message
      );
      return { success: true, message: "Email service not configured" };
    }

    const response = await transporter.sendMail({
      from: `${process.env.BUSINESS_NAME} <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: "Payment Reminder - E BooK",
      text: message,
      html: `<p>${message}</p>`,
    });

    console.log("Email sent successfully:", response.messageId);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error("Error sending Email:", error.message);
    return { success: false, error: error.message };
  }
};

export default sendEmail;
