
import Goal from "../models/Goal.js";
import Transaction from "../models/Transaction.js";


export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });
    res.status(200).json(goals);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch goals", error: error.message });
  }
};


export const getGoalById = async (req, res) => {
  try {
    const goal = await Goal.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    
    
    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
    
    
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    
    
    let dailySavingRate = null;
    if (goal.targetDate) {
      const today = new Date();
      const daysRemaining = Math.max(1, Math.ceil((goal.targetDate - today) / (1000 * 60 * 60 * 24)));
      dailySavingRate = remainingAmount / daysRemaining;
    }
    
    res.status(200).json({
      ...goal.toObject(),
      progressPercentage,
      remainingAmount,
      dailySavingRate
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch goal", error: error.message });
  }
};


export const createGoal = async (req, res) => {
  try {
    const { name, targetAmount, targetDate, category, autoSave, autoSaveAmount, autoSaveFrequency } = req.body;
    
    if (!name || !targetAmount) {
      return res.status(400).json({ message: "Name and target amount are required" });
    }
    
    const newGoal = new Goal({
      userId: req.user.id,
      name,
      targetAmount,
      targetDate: targetDate ? new Date(targetDate) : null,
      category,
      autoSave: Boolean(autoSave),
      autoSaveAmount,
      autoSaveFrequency
    });
    
    const savedGoal = await newGoal.save();
    res.status(201).json(savedGoal);
  } catch (error) {
    res.status(500).json({ message: "Failed to create goal", error: error.message });
  }
};


export const updateGoal = async (req, res) => {
  try {
    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    
    if (!updatedGoal) {
      return res.status(404).json({ message: "Goal not found or not authorized" });
    }
    
    res.status(200).json(updatedGoal);
  } catch (error) {
    res.status(500).json({ message: "Failed to update goal", error: error.message });
  }
};


export const deleteGoal = async (req, res) => {
  try {
    const deletedGoal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!deletedGoal) {
      return res.status(404).json({ message: "Goal not found or not authorized" });
    }
    
    res.status(200).json({ message: "Goal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete goal", error: error.message });
  }
};


export const contributeToGoal = async (req, res) => {
  try {
    const { amount, createTransaction: shouldCreateTransaction = true } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }
    
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    
    
    goal.currentAmount += parseFloat(amount);
    
    
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = "completed";
    }
    
    await goal.save();
    
    
    if (shouldCreateTransaction) {
      const transaction = new Transaction({
        userId: req.user.id,
        type: "expense", // Saving money is an expense from available funds
        amount: parseFloat(amount),
        category: "Savings",
        tags: ["goal", goal.name],
        date: new Date(),
        notes: `Contribution to goal: ${goal.name}`
      });
      
      await transaction.save();
    }
    
    
    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
    
    res.status(200).json({
      message: "Contribution added successfully",
      goalId: goal._id,
      newAmount: goal.currentAmount,
      targetAmount: goal.targetAmount,
      progressPercentage,
      isCompleted: goal.status === "completed"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add contribution", error: error.message });
  }
};


export const processAutoSavings = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    
    const goals = await Goal.find({
      autoSave: true,
      status: "in-progress"
    });
    
    for (const goal of goals) {
      let shouldSave = false;
      
      if (goal.autoSaveFrequency === "daily") {
        shouldSave = true;
      } else if (goal.autoSaveFrequency === "weekly" && today.getDay() === 0) { // Sunday
        shouldSave = true;
      } else if (goal.autoSaveFrequency === "monthly" && today.getDate() === 1) { // First day of month
        shouldSave = true;
      }
      
      if (shouldSave) {
        
        const remainingAmount = goal.targetAmount - goal.currentAmount;
        const amountToSave = Math.min(goal.autoSaveAmount, remainingAmount);
        
        if (amountToSave > 0) {
          
          goal.currentAmount += amountToSave;
          
          if (goal.currentAmount >= goal.targetAmount) {
            goal.status = "completed";
          }
          
          await goal.save();
          
          // Create transaction
          const transaction = new Transaction({
            userId: goal.userId,
            type: "expense",
            amount: amountToSave,
            category: "Savings",
            tags: ["auto-save", goal.name],
            date: today,
            notes: `Auto-save for goal: ${goal.name}`
          });
          
          await transaction.save();
        }
      }
    }
  } catch (error) {
    console.error("Error processing auto-savings:", error);
  }
};