import nodemailer from "nodemailer";
import cron from "node-cron";
import dotenv from "dotenv";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

dotenv.config();


cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Running cron job for upcoming transactions...");

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const upcomingTransactions = await Transaction.find({
      recurring: true,
      nextTransactionDate: { $lte: tomorrow },
      recurrenceEndDate: { $gte: tomorrow },
    });

    if (upcomingTransactions.length === 0) {
      console.log("✅ No upcoming transactions found.");
      return;
    }

    for (const transaction of upcomingTransactions) {
      console.log(`📩 Sending email for transaction ID: ${transaction._id}`);
      await sendEmailNotification(transaction.userId, transaction);
    }

    console.log("✅ All notification emails sent successfully.");
  } catch (error) {
    console.error("❌ Error in cron job:", error);
  }
});


async function sendEmailNotification(userId, transaction) {
  try {
   

    console.log(`📤 Sending email to ...`);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
            type: "OAUTH2",
            user: process.env.GMAIL_USERNAME,
            clientId: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN,
            accessToken: process.env.OAUTH_ACCESS_TOKEN,
            expires: 10000
      }
    });

    const mailOptions = {
      from: "kavindugav@gmail.com",
      to: "gavesha70@gmail.com", // Send to actual user email
      subject: `Upcoming Transaction Reminder: `,
      text: `Hello ,\n\nYour  transaction of amount $ is due soon.\n\nThank you!`,
    };

    const info = transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

// Manually trigger cron for testing
(async () => {
  console.log("🚀 Running manual email test...");
  await sendEmailNotification("67ced706b805db866c34397e", { category: "Rent", amount: 500 });
})();
