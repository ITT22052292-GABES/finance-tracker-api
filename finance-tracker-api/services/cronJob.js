
import { handleRecurringTransactions } from "../services/transactionService.js";
import { processAutoSavings } from "../controllers/goalController.js";
import nodemailer from "nodemailer";
import cron from "node-cron";
import dotenv from "dotenv";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";


cron.schedule("* * * * *", async () => {
  try {
    console.log("🔄 Running recurring transactions cron job...");

    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    
    const recurringTransactions = await Transaction.find({
      recurring: true,
      nextTransactionDate: "2025-03-27T18:30:00.000Z",
    });

    if (recurringTransactions.length === 0) {
      console.log("✅ No pending recurring transactions.");
      return;
    }

    for (const transaction of recurringTransactions) {
      await handleRecurringTransactions(transaction);
      await sendEmailNotification(transaction.userId, transaction);
    }

    console.log("✅ Recurring transactions processed successfully.");
  } catch (error) {
    console.error("❌ Error processing recurring transactions:", error);
  }
});

cron.schedule("* * * * *", async () => { 
  try {
    console.log("🔄 Running auto-savings cron job...");
    await processAutoSavings();
    console.log("✅ Auto-savings processed successfully.");
  } catch (error) {
    console.error("❌ Error processing auto-savings:", error);
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
  console.log("🚀 Running manual cron job...");
  await cron.schedule("* * * * *", async () => {
    console.log("🔄 Running cron job...");
    await handleRecurringTransactions({
      userId: "testUserId",
      type: "expense",
      amount: 500,
      category: "Rent",
      tags: ["monthly"],
      date: new Date(),
      recurring: true,
      recurrencePattern: "monthly",
      recurrenceEndDate: new Date("2025-12-31"),
      nextTransactionDate: new Date(),
    });
  });
})();
