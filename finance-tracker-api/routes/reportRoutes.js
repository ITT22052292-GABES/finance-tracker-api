// Create reportRoutes.js
import express from "express";
import { generateIncomeExpenseReport, generateCategoryReport, generateTimeSeriesReport } from "../controllers/reportController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const reportRouter = express.Router();
reportRouter.use(authMiddleware);

reportRouter.get('/income-expense', generateIncomeExpenseReport);
reportRouter.get('/by-category', generateCategoryReport);
reportRouter.get('/time-series', generateTimeSeriesReport);

export default reportRouter;