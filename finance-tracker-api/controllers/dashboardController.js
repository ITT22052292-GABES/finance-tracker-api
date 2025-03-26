import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import Goal from "../models/Goal.js";
import User from "../models/User.js";


export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    
    const recentTransactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(5);
    
    
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    
    const activeBudgets = await Budget.find({
      userId,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    });
    
    const budgetsWithProgress = await Promise.all(activeBudgets.map(async (budget) => {
      const budgetTransactions = await Transaction.find({
        userId,
        category: budget.category,
        date: { $gte: budget.startDate, $lte: budget.endDate }
      });
      
      const totalSpent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
      const percentUsed = (totalSpent / budget.limit) * 100;
      
      return {
        ...budget.toObject(),
        totalSpent,
        percentUsed,
        remaining: budget.limit - totalSpent
      };
    }));
    
    
    const goals = await Goal.find({ userId });
    const activeGoals = goals.map(goal => {
      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
      return {
        ...goal.toObject(),
        progressPercentage
      };
    });
    
    
    const categoryBreakdown = {};
    transactions.forEach(transaction => {
      if (!categoryBreakdown[transaction.category]) {
        categoryBreakdown[transaction.category] = 0;
      }
      if (transaction.type === 'expense') {
        categoryBreakdown[transaction.category] += transaction.amount;
      }
    });
    
    res.json({
      summary: {
        income,
        expenses,
        balance: income - expenses,
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0
      },
      recentTransactions,
      activeBudgets: budgetsWithProgress,
      activeGoals,
      categoryBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard data", error: error.message });
  }
};


export const getAdminDashboard = async (req, res) => {
  try {
    
    const userCount = await User.countDocuments();
    
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersCount = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    
    const transactionCount = await Transaction.countDocuments();
    
    
    const currentDate = new Date();
    const activeBudgetCount = await Budget.countDocuments({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    });
    
    
    const incomeSum = await Transaction.aggregate([
      { $match: { type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const expenseSum = await Transaction.aggregate([
      { $match: { type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalIncome = incomeSum.length > 0 ? incomeSum[0].total : 0;
    const totalExpenses = expenseSum.length > 0 ? expenseSum[0].total : 0;
    
    
    const recentTransactions = await Transaction.find()
      .sort({ date: -1 })
      .limit(10)
      .populate('userId', 'name email');
    
    res.json({
      userStats: {
        totalUsers: userCount,
        newUsers: newUsersCount,
        userGrowthRate: userCount > 0 ? (newUsersCount / userCount) * 100 : 0
      },
      systemStats: {
        totalTransactions: transactionCount,
        activeBudgets: activeBudgetCount
      },
      financialOverview: {
        totalIncome,
        totalExpenses,
        systemBalance: totalIncome - totalExpenses
      },
      recentActivity: recentTransactions
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin dashboard data", error: error.message });
  }
};