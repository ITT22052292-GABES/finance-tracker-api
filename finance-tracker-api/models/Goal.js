import { Schema, model } from "mongoose";

const GoalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  targetDate: Date,
  category: String,
  autoSave: { type: Boolean, default: false },
  autoSaveAmount: Number,
  autoSaveFrequency: { 
    type: String, 
    enum: ["daily", "weekly", "monthly"], 
    required: function () { return this.autoSave; } 
  },
  status: { 
    type: String, 
    enum: ["in-progress", "completed", "cancelled"], 
    default: "in-progress" 
  }
});

export default model("Goal", GoalSchema);