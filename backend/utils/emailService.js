import dotenv from "dotenv";
dotenv.config();

/* ==========================================
   MAILJET REST EMAIL (RENDER SAFE)
========================================== */
const sendEmail = async (email, message) => {
  try {
    const apiKey = process.env.SMS_API_KEY;
    const secretKey = process.env.SMS_SECRET_KEY;

    if (!apiKey || !secretKey) {
      console.error("❌ Mailjet credentials missing");
      return { success: false, error: "Mailjet not configured" };
    }

    const payload = {
      Messages: [
        {
          From: {
            Email: process.env.FROM_EMAIL,
            Name: process.env.BUSINESS_NAME,
          },
          To: [
            {
              Email: email,
            },
          ],
          Subject: "Payment Reminder - E BooK",
          TextPart: message,
          HTMLPart: `<p>${message}</p>`,
        },
      ],
    };

    const auth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Mailjet REST error:", data);
      return { success: false, error: data };
    }

    console.log("✅ Email sent via Mailjet REST");
    return {
      success: true,
      messageId: data.Messages[0].To[0].MessageID,
    };

  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    return { success: false, error: error.message };
  }
};

export default sendEmail;
