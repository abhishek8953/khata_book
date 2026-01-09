import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "in-v3.mailjet.com",
  port: 587,
  secure: false, // MUST be false for 587
  auth: {
    user: process.env.SMS_API_KEY,       // Mailjet API KEY
    pass: process.env.SMS_SECRET_KEY,    // Mailjet SECRET KEY
  },
  tls: {
    rejectUnauthorized: false, // REQUIRED for Render
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mailjet SMTP connection failed:", error);
  } else {
    console.log("✅ Mailjet SMTP server is ready");
  }
});

const sendEmail = async (email, message) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.BUSINESS_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: "Payment Reminder - E BooK",
      text: message,
      html: `<p>${message}</p>`,
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return { success: false, error: error.message };
  }
};

export default sendEmail;
