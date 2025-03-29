/**
 * Middleware to validate transaction inputs
 */
export const validateTransaction = (req, res, next) => {
    const { type, amount, category, date, recurring, recurrencePattern } = req.body;
    
    // Validate required fields
    if (!type) {
      return res.status(400).json({ error: 'Transaction type is required' });
    }
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    
    // Validate type enum
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Type must be either income or expense' });
    }
    
    // Validate amount is a number and positive
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    
    // Validate date is valid
    if (date && isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    // Validate recurrence pattern if recurring
    if (recurring === true && recurrencePattern) {
      const validPatterns = ['daily', 'weekly', 'monthly', 'yearly'];
      if (!validPatterns.includes(recurrencePattern)) {
        return res.status(400).json({ error: 'Invalid recurrence pattern' });
      }
    }
    
    next();
  };