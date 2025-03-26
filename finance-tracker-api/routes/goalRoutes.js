// Create goalRoutes.js
import express from "express";
import { 
  getGoals, 
  getGoalById, 
  createGoal, 
  updateGoal, 
  deleteGoal,
  contributeToGoal 
} from "../controllers/goalController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const goalRouter = express.Router();
goalRouter.use(authMiddleware);

goalRouter.get('/list/', getGoals);
goalRouter.get('/:id', getGoalById);
goalRouter.post('/', createGoal);
goalRouter.put('/:id', updateGoal);
goalRouter.delete('/:id', deleteGoal);
goalRouter.post('/:id/contribute', contributeToGoal);

export default goalRouter;