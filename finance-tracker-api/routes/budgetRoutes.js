import express from 'express';
import { 
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetsByCategory,
  getActiveBudgets
} from '../controllers/budgetController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const budgetRouter = express.Router();




budgetRouter.get('/list/',authMiddleware, getBudgets);
budgetRouter.get('/:id', authMiddleware,getBudgetById);
budgetRouter.post('/', authMiddleware,createBudget);
budgetRouter.put('/:id',authMiddleware, updateBudget);
budgetRouter.delete('/:id',authMiddleware, deleteBudget);


budgetRouter.get('/category/:category', getBudgetsByCategory);
budgetRouter.get('/status/active', getActiveBudgets);

export default budgetRouter;