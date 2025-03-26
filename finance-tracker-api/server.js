import dotenv from "dotenv";

import express, { json } from "express";
import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"; 
import reportRoutes from "./routes/reportRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import "./services/cronJob.js"; 

dotenv.config();

const app = express();
app.use(json());

connectDB();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


app.use("/api/auth", authRoutes);

app.use("/api/transactions", authMiddleware, transactionRoutes);
app.use("/api/budgets", authMiddleware, budgetRoutes);
app.use("/api/admin", authMiddleware, adminRoutes); 
app.use("/api/reports", authMiddleware, reportRoutes);
app.use("/api/goals", authMiddleware, goalRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);

export default app;




