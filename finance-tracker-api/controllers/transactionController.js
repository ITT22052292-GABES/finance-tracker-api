import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import { handleRecurringTransactions } from "../services/transactionService.js";


async function checkBudgetLimits(userId, category, amount, date) {
  try {
   
    const budget = await Budget.findOne({
      userId,
      category,
      startDate: { $lte: date },
      endDate: { $gte: date }
    });
    
    if (!budget) {
      return { hasBudget: false };
    }
    
    
    const transactions = await Transaction.find({
      userId,
      category,
      date: { $gte: budget.startDate, $lte: budget.endDate }
    });
    
    
    const currentTotal = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    
    const newTotal = currentTotal + amount;
    const percentUsed = (newTotal / budget.limit) * 100;
    
    let warningMessage = null;
    if (percentUsed >= 100) {
      warningMessage = 'Budget limit exceeded!';
    } else if (percentUsed >= 80) {
      warningMessage = 'Approaching budget limit!';
    }
    
    return {
      hasBudget: true,
      budgetId: budget._id,
      budgetLimit: budget.limit,
      currentSpent: currentTotal,
      newTotal,
      percentUsed,
      warningMessage
    };
  } catch (error) {
    console.error("Error checking budget limits:", error);
    return { hasBudget: false, error: error.message };
  }
}


export async function createTransaction(req, res) {
  try {
    const { 
      recurring, 
      recurrencePattern, 
      recurrenceEndDate, 
      nextTransactionDate,
      category,
      amount,
      date
    } = req.body;
    
    
    if (recurring) {
      // If it's a recurring transaction, validate recurrencePattern and other necessary data
      if (!recurrencePattern || !nextTransactionDate) {
        return res.status(400).json({ 
          error: "Recurring transactions require a recurrence pattern and next transaction date" 
        });
      }
    }
    
    
    const budgetCheck = await checkBudgetLimits(
      req.user.id,
      category,
      parseFloat(amount),
      new Date(date)
    );
    
    
    const transaction = new Transaction({ 
      ...req.body, 
      userId: req.user.id 
    });
    
    await transaction.save();
    
    
    if (recurring) {
      
      await handleRecurringTransactions(transaction);
    }
    
    
    res.status(201).json({
      transaction: transaction,
      budgetInfo: budgetCheck.hasBudget ? {
        budgetLimit: budgetCheck.budgetLimit,
        totalSpent: budgetCheck.newTotal,
        percentUsed: budgetCheck.percentUsed,
        warningMessage: budgetCheck.warningMessage
      } : null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}


export async function getTransactions(req, res) {
  try {
    const transactions = await Transaction.find({ userId: req.user.id });
    res.json(transactions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}


export async function getTransactionById(req, res) {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}


export async function updateTransaction(req, res) {
  try {
    const {
      category,
      amount,
      date,
      recurring,
      recurrencePattern,
      nextTransactionDate
    } = req.body;
    
    
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    
    let budgetCheck = null;
    if (category || amount) {
      budgetCheck = await checkBudgetLimits(
        req.user.id,
        category || transaction.category,
        parseFloat(amount) || transaction.amount,
        new Date(date || transaction.date)
      );
    }
    
    
    Object.keys(req.body).forEach(key => {
      transaction[key] = req.body[key];
    });
    
    
    if (recurring && (recurrencePattern !== transaction.recurrencePattern || nextTransactionDate)) {
      await handleRecurringTransactions(transaction);
    }
    
    await transaction.save();
    
    
    res.json({
      transaction: transaction,
      budgetInfo: budgetCheck && budgetCheck.hasBudget ? {
        budgetLimit: budgetCheck.budgetLimit,
        totalSpent: budgetCheck.newTotal,
        percentUsed: budgetCheck.percentUsed,
        warningMessage: budgetCheck.warningMessage
      } : null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}


export async function deleteTransaction(req, res) {
  try {
    const result = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!result) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}


export async function getTransactionsByCategory(req, res) {
  try {
    const { category } = req.params;
    
    const transactions = await Transaction.find({
      userId: req.user.id,
      category
    });
    
    res.json(transactions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}


export async function getTransactionsWithBudgetStatus(req, res) {
  try {
    const { category, startDate, endDate } = req.query;
    const query = { userId: req.user.id };
    
    // Add filters if provided
    if (category) query.category = category;
    if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    
    const transactions = await Transaction.find(query);
    
    
    let budgetInfo = null;
    if (category && startDate && endDate) {
      
      const budget = await Budget.findOne({
        userId: req.user.id,
        category,
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) }
      });
      
      if (budget) {
        
        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
        const percentUsed = (totalSpent / budget.limit) * 100;
        
        let warningMessage = null;
        if (percentUsed >= 100) {
          warningMessage = 'Budget limit exceeded!';
        } else if (percentUsed >= 80) {
          warningMessage = 'Approaching budget limit!';
        }
        
        budgetInfo = {
          budgetId: budget._id,
          budgetLimit: budget.limit,
          totalSpent,
          percentUsed,
          warningMessage
        };
      }
    }
    
    res.json({
      transactions,
      budgetInfo
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function getTransactionsByTag(req, res) {
  try {
    const { tag } = req.params;
    
    const transactions = await Transaction.find({
      userId: req.user.id,
      tags: { $in: [tag] }
    });
    
    res.json(transactions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function getAllTags(req, res) {
  try {
    const transactions = await Transaction.find({ userId: req.user.id });
    
    // Extract unique tags
    const allTags = new Set();
    transactions.forEach(transaction => {
      transaction.tags.forEach(tag => {
        allTags.add(tag);
      });
    });
    
    res.json(Array.from(allTags));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}