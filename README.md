# Personal Finance Tracker API

A RESTful API for managing personal finances, tracking expenses, setting budgets, and analyzing spending trends.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:

4. Run the application: `npm start`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/category/:category` - Get transactions by category
- `GET /api/transactions/tags/all` - Get all unique tags
- `GET /api/transactions/tags/:tag` - Get transactions by tag

### Budgets
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/:id` - Get budget by ID
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/category/:category` - Get budgets by category
- `GET /api/budgets/status/active` - Get active budgets

### Goals
- `GET /api/goals` - Get all goals
- `GET /api/goals/:id` - Get goal by ID
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/contribute` - Contribute to goal

### Reports
- `GET /api/reports/income-expense` - Get income vs expense report
- `GET /api/reports/by-category` - Get spending by category report
- `GET /api/reports/time-series` - Get time series spending report

### Dashboard
- `GET /api/dashboard/user` - Get user dashboard data
- `GET /api/dashboard/admin` - Get admin dashboard data (admin only)

### Admin Routes
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/users/:userId` - Get user details (admin only)
- `DELETE /api/admin/budgets/:id` - Delete any budget (admin only)

## Features
- JWT Authentication with role-based access control
- Budget management with alerts and notifications
- Transaction management with categories and tags
- Recurring transactions
- Goals and savings tracking
- Financial reporting
- Role-based dashboards

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
