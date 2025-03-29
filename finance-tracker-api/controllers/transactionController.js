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
      amount, 
      category, 
      description, 
      date, 
      type, 
      tags,
      recurring,
      recurrencePattern,
      nextTransactionDate,
      recurrenceEndDate 
    } = req.body;
    
    // Create a new transaction
    const transaction = new Transaction({
      userId: req.user.id,
      amount,
      category,
      description,
      date: date || new Date(),
      type,
      tags,
      recurring,
      recurrencePattern,
      nextTransactionDate,
      recurrenceEndDate
    });
    
    // Let Mongoose validation handle errors
    await transaction.save();
    
    res.status(201).json(transaction);
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ errors: validationErrors });
    }
    
    res.status(500).json({ error: error.message });
  }
}

export async function getTransactionById(req, res) {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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





export async function updateTransaction(req, res) {
  try {
    const { 
      amount, 
      category, 
      description, 
      date, 
      type, 
      tags,
      recurring,
      recurrencePattern,
      nextTransactionDate,
      recurrenceEndDate 
    } = req.body;
    
    const transaction = await Transaction.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Update fields
    if (amount) transaction.amount = amount;
    if (category) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = date;
    if (type) transaction.type = type;
    if (tags) transaction.tags = tags;
    if (recurring !== undefined) transaction.recurring = recurring;
    if (recurrencePattern) transaction.recurrencePattern = recurrencePattern;
    if (nextTransactionDate) transaction.nextTransactionDate = nextTransactionDate;
    if (recurrenceEndDate) transaction.recurrenceEndDate = recurrenceEndDate;
    
    // Let Mongoose validation handle errors
    await transaction.save();
    
    res.json(transaction);
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ errors: validationErrors });
    }
    
    res.status(500).json({ error: error.message });
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
    
    // Validate category parameter
    if (typeof category !== 'string' || category.includes('$') || category.startsWith('/')) {
      return res.status(400).json({ error: "Invalid category format" });
    }
    
    // Now safe to use in query
    const transactions = await Transaction.find({ 
      userId: req.user.id,
      category: category
    });
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
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