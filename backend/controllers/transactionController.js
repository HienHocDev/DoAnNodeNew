const Transaction = require('../models/Transaction');

// @desc    Get transactions for a user
// @route   GET /api/transactions
// @access  Private (Needs auth middleware, mocked for now)
const getTransactions = async (req, res) => {
  try {
    // Hardcode user ID for testing since we don't have auth middleware yet
    // In production, use req.user.id
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, note, userId } = req.body;

    if (!amount || !type || !category || !userId) {
      return res.status(400).json({ message: 'Vui lòng điền đủ thông tin giao dịch' });
    }

    const transaction = await Transaction.create({
      user: userId,
      amount,
      type,
      category,
      date: date || Date.now(),
      note
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
};
