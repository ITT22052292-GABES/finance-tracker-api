import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either income or expense'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    validate: {
      validator: function(value) {
        return value > 0 && value <= 999999999.99; // Limit to reasonable amount
      },
      message: 'Amount must be positive and less than 1 billion'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    validate: {
      validator: function(value) {
        // Optional: Validate date isn't too far in the future
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 5); // Allow up to 5 years in future
        return value <= maxDate;
      },
      message: 'Date cannot be more than 5 years in the future'
    }
  },
  tags: [String],
  recurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: {
      values: ['daily', 'weekly', 'monthly', 'yearly', ''],
      message: 'Invalid recurrence pattern'
    },
    default: ''
  },
  nextTransactionDate: {
    type: Date
  },
  recurrenceEndDate: {
    type: Date
  },
  originalAmount: {
    type: Number
  },
  originalCurrency: {
    type: String,
    default: 'USD'
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;