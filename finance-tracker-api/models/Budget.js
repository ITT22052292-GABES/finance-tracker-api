import { Schema, model } from "mongoose";

const BudgetSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  category: String,
  limit: Number,
  startDate: Date,
  endDate: Date,
});

export default model("Budget", BudgetSchema);