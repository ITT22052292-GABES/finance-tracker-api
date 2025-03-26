import Transaction from "../models/Transaction.js";


export async function handleRecurringTransactions(transaction) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  
  const nextTransactionDate = calculateNextTransactionDate(transaction);

  
  if (nextTransactionDate.getTime() <= today.getTime() || nextTransactionDate > transaction.recurrenceEndDate) {
    return;
  }

  
  const existingTransaction = await Transaction.findOne({
    userId: transaction.userId,
    date: nextTransactionDate,
    type: transaction.type,
    amount: transaction.amount,
  });

  if (existingTransaction) {
    console.log("Skipping duplicate recurring transaction for:", nextTransactionDate);
    return;
  }

  
  const newTransaction = new Transaction({
    userId: transaction.userId,
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    tags: transaction.tags,
    date: nextTransactionDate, 
    recurring: true,
    recurrencePattern: transaction.recurrencePattern,
    recurrenceEndDate: transaction.recurrenceEndDate,
    nextTransactionDate, 
  });

  await newTransaction.save();

  
  await Transaction.findByIdAndUpdate(transaction._id, { nextTransactionDate });
}


function calculateNextTransactionDate(transaction) {
  const currentDate = new Date(transaction.nextTransactionDate);

  switch (transaction.recurrencePattern) {
    case "daily":
      currentDate.setDate(currentDate.getDate() + 1);
      break;
    case "weekly":
      currentDate.setDate(currentDate.getDate() + 7);
      break;
    case "monthly":
      currentDate.setMonth(currentDate.getMonth() + 1);
      break;
    default:
      throw new Error("Invalid recurrence pattern");
  }

  return currentDate;
}
