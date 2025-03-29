import express from "express";
import { createTransaction, getTransactions,getTransactionById,updateTransaction,deleteTransaction,getTransactionsByCategory, getTransactionsByTag, getAllTags } from "../controllers/transactionController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { validateTransaction } from '../middleware/validationMiddleware.js';


const transactionRouter = express.Router();
transactionRouter.use(authMiddleware);

transactionRouter.get('/list/', getTransactions);
transactionRouter.get('/:id', getTransactionById);
transactionRouter.post('/',validateTransaction, createTransaction);
transactionRouter.put('/:id',validateTransaction, updateTransaction);
transactionRouter.delete('/:id', deleteTransaction);
transactionRouter.get('/category/:category', getTransactionsByCategory);
transactionRouter.get('/tags/all', getAllTags);
transactionRouter.get('/tags/:tag', getTransactionsByTag);

export default transactionRouter;
