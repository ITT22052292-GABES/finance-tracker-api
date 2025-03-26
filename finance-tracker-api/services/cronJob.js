import cron from "node-cron";
import Transaction from "../models/Transaction.js";
import { handleRecurringTransactions } from "../services/transactionService.js";
import { processAutoSavings } from "../controllers/goalController.js";


cron.schedule("0 0 * * *", async () => {
  try {
    console.log("🔄 Running recurring transactions cron job...");

    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    
    const recurringTransactions = await Transaction.find({
      recurring: true,
      nextTransactionDate: { $lte: today },
    });

    if (recurringTransactions.length === 0) {
      console.log("✅ No pending recurring transactions.");
      return;
    }

    for (const transaction of recurringTransactions) {
      await handleRecurringTransactions(transaction);
    }

    console.log("✅ Recurring transactions processed successfully.");
  } catch (error) {
    console.error("❌ Error processing recurring transactions:", error);
  }
});

cron.schedule("0 1 * * *", async () => { 
  try {
    console.log("🔄 Running auto-savings cron job...");
    await processAutoSavings();
    console.log("✅ Auto-savings processed successfully.");
  } catch (error) {
    console.error("❌ Error processing auto-savings:", error);
  }
});


(async () => {
  console.log("🚀 Running manual cron job...");
  await cron.schedule("0 0 * * *", async () => {
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
