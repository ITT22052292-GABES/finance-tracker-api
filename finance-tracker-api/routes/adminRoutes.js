import express from 'express';
import { getUserDetails, getAllUsers } from '../controllers/userController.js';
import { deleteBudget } from '../controllers/budgetController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { adminAuth } from '../middleware/adminMiddleware.js';

const router = express.Router();


router.use(authMiddleware);
router.use(adminAuth); 


router.get('/users', adminAuth, getAllUsers);
router.get('/users/:userId', getUserDetails);


router.delete('/budgets/:id', deleteBudget);

export default router;