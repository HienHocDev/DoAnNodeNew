require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Finance Tracker API' });
});

// Define routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));

// Placeholders for future
// app.use('/api/wallets', require('./routes/walletRoutes'));
// app.use('/api/budgets', require('./routes/budgetRoutes'));
// app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
const PORT = process.env.PORT || 5000;

app.use('/api/analytics', require('./routes/analyticsRoutes'));

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
