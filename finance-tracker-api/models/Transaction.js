import { Schema, model } from "mongoose";

const TransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["income", "expense"], required: true },
  amount: Number,
  category: String,
  tags: [String],
  date: { type: Date, default: Date.now },
  recurring: { type: Boolean, default: false },
  recurrencePattern: { 
    type: String, 
    enum: ["daily", "weekly", "monthly"], 
    required: function () { return this.recurring; } 
  },
  recurrenceEndDate: { type: Date}, 
  nextTransactionDate: { type: Date, required: function () { return this.recurring; } }, 
});

export default model("Transaction", TransactionSchema);
