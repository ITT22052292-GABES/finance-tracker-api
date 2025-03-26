import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js'; 


export const getBudgets = async (req, res) => {
  try {
   
    const budgets = await Budget.find({ userId: req.user._id });
    res.status(200).json(budgets);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch budgets", error: error.message });
  }
};


export const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findOne({ 
      _id: req.params.id,
      userId: req.user._id 
    });
    
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    
    
    const transactions = await Transaction.find({
      userId: req.user._id,
      category: budget.category,
      date: { $gte: budget.startDate, $lte: budget.endDate }
    });
    
    
    const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    
    const percentUsed = (totalSpent / budget.limit) * 100;
    
    
    let warningMessage = null;
    if (percentUsed >= 100) {
      warningMessage = 'Budget limit exceeded!';
    } else if (percentUsed >= 80) {
      warningMessage = 'Approaching budget limit!';
    }
    
    res.status(200).json({
      ...budget.toObject(),
      totalSpent,
      percentUsed,
      warningMessage
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch budget", error: error.message });
  }
};


export const createBudget = async (req, res) => {
  try {
    const { category, limit, startDate, endDate } = req.body;
    
    // Validation
    if (!category || !limit || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    const newBudget = new Budget({
      userId: req.user._id,
      category,
      limit,
      startDate,
      endDate
    });
    
    const savedBudget = await newBudget.save();
    res.status(201).json(savedBudget);
  } catch (error) {
    res.status(500).json({ message: "Failed to create budget", error: error.message });
  }
};


export const updateBudget = async (req, res) => {
  try {
    const { category, limit, startDate, endDate } = req.body;
    
    const updatedBudget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { category, limit, startDate, endDate },
      { new: true }
    );
    
    if (!updatedBudget) {
      return res.status(404).json({ message: "Budget not found or not authorized" });
    }
    
    res.status(200).json(updatedBudget);
  } catch (error) {
    res.status(500).json({ message: "Failed to update budget", error: error.message });
  }
};


export const deleteBudget = async (req, res) => {
  try {
    let deletedBudget;
    
    
    if (req.user.role === 'admin') {
      deletedBudget = await Budget.findByIdAndDelete(req.params.id);
    } else {
      
      deletedBudget = await Budget.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
      });
    }
    
    if (!deletedBudget) {
      return res.status(404).json({ message: "Budget not found or not authorized" });
    }
    
    res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete budget", error: error.message });
  }
};


export const getBudgetsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const budgets = await Budget.find({
      userId: req.user._id,
      category
    });
    
    res.status(200).json(budgets);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch budgets by category", error: error.message });
  }
};

export const getActiveBudgets = async (req, res) => {
  try {
    const currentDate = new Date();
    
    const activeBudgets = await Budget.find({
      userId: req.user._id,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    });
    
    
    const budgetsWithProgress = await Promise.all(activeBudgets.map(async (budget) => {
      const transactions = await Transaction.find({
        userId: req.user._id,
        category: budget.category,
        date: { $gte: budget.startDate, $lte: budget.endDate }
      });
      
      const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      const percentUsed = (totalSpent / budget.limit) * 100;
      
      let warningMessage = null;
      if (percentUsed >= 100) {
        warningMessage = 'Budget limit exceeded!';
      } else if (percentUsed >= 80) {
        warningMessage = 'Approaching budget limit!';
      }
      
      return {
        ...budget.toObject(),
        totalSpent,
        percentUsed,
        warningMessage
      };
    }));
    
    res.status(200).json(budgetsWithProgress);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch active budgets", error: error.message });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    
    const users = await User.find({}, 'name email createdAt');
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};


export const getUserDetails = async (req, res) => {
  try {
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    const { userId } = req.params;
    const user = await User.findById(userId, 'name email createdAt');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user details", error: error.message });
  }
};


export const checkBudgetLimits = async (userId, category, amount, date) => {
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
};