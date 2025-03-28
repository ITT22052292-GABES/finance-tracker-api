import nodemailer from "nodemailer";
import cron from "node-cron";
import dotenv from "dotenv";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import connectDB from "../config/database.js";

dotenv.config();


cron.schedule("* * * * *", async () => {
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
    //connectDB();
    //console.log("🔄 Connecting to database...");
    
    const user = await User.findById(userId);
    if (!user) {
      console.error(`❌ User with ID ${userId} not found`);
      return;
    }

    console.log(`📤 Sending email to ${user.email}...`);

    const transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.GMAIL_USERNAME, 
        pass: process.env.GMAIL_PASSWORD,  
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USERNAME ,
      to: user.email || "gavesha70@gmail.com", // Use user's email or fallback to test email
      subject: `Upcoming Transaction Reminder: ${transaction.category}`,
      text: `Hello ${user.name || 'there'},\n\nYour ${transaction.category} transaction of amount $${transaction.amount} is due soon.\n\nThank you!`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
}


(async () => {
  console.log("🚀 Running manual email test...");
  await sendEmailNotification("67ced706b805db866c34397e", { category: "Rent", amount: 500 });
})();
