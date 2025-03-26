
import Transaction from "../models/Transaction.js";


export const generateIncomeExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.user.id };
    
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const transactions = await Transaction.find(filter);
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    res.json({
      income,
      expense,
      balance: income - expense,
      totalTransactions: transactions.length
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate report", error: error.message });
  }
};


export const generateCategoryReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.user.id };
    
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const transactions = await Transaction.find(filter);
    
    const categoryData = {};
    
    transactions.forEach(transaction => {
      if (!categoryData[transaction.category]) {
        categoryData[transaction.category] = {
          total: 0,
          count: 0
        };
      }
      
      categoryData[transaction.category].total += transaction.amount;
      categoryData[transaction.category].count += 1;
    });
    
    res.json(categoryData);
  } catch (error) {
    res.status(500).json({ message: "Failed to generate category report", error: error.message });
  }
};


export const generateTimeSeriesReport = async (req, res) => {
  try {
    const { startDate, endDate, interval = 'month' } = req.query;
    const filter = { userId: req.user.id };
    
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const transactions = await Transaction.find(filter).sort({ date: 1 });
    
    const timeSeriesData = {};
    
    transactions.forEach(transaction => {
      let period;
      const date = new Date(transaction.date);
      
      if (interval === 'day') {
        period = date.toISOString().split('T')[0];
      } else if (interval === 'week') {
        // Get the week number
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        period = `${date.getFullYear()}-W${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
      } else if (interval === 'month') {
        period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        period = date.getFullYear().toString();
      }
      
      if (!timeSeriesData[period]) {
        timeSeriesData[period] = {
          income: 0,
          expense: 0
        };
      }
      
      if (transaction.type === 'income') {
        timeSeriesData[period].income += transaction.amount;
      } else {
        timeSeriesData[period].expense += transaction.amount;
      }
    });
    
    const result = Object.keys(timeSeriesData).map(period => ({
      period,
      ...timeSeriesData[period],
      balance: timeSeriesData[period].income - timeSeriesData[period].expense
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to generate time series report", error: error.message });
  }
};