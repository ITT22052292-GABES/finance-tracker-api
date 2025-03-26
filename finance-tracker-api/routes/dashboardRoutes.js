
import express from "express";
import { getUserDashboard, getAdminDashboard } from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminAuth } from "../middleware/adminMiddleware.js";

const dashboardRouter = express.Router();
dashboardRouter.use(authMiddleware);


dashboardRouter.get('/user', getUserDashboard);


dashboardRouter.get('/admin', adminAuth, getAdminDashboard);

export default dashboardRouter;