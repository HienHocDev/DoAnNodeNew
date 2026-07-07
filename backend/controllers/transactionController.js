const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

// @desc    Get transactions for a user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('wallet', 'name icon')
      .sort({ date: -1 });
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
    const { amount, type, category, date, note, walletId } = req.body;

    if (!amount || !type || !category || !walletId) {
      return res.status(400).json({ message: 'Vui lòng điền đủ thông tin giao dịch và chọn ví' });
    }

    // Check if wallet exists and belongs to user
    const wallet = await Wallet.findOne({ _id: walletId, user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: 'Không tìm thấy ví' });
    }

    // Create transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      wallet: walletId,
      amount,
      type,
      category,
      date: date || Date.now(),
      note
    });

    // Update wallet balance
    if (type === 'income') {
      wallet.balance += Number(amount);
    } else if (type === 'expense') {
      wallet.balance -= Number(amount);
    }
    await wallet.save();

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }

    // Revert wallet balance
    const wallet = await Wallet.findById(transaction.wallet);
    if (wallet) {
      if (transaction.type === 'income') {
        wallet.balance -= transaction.amount;
      } else {
        wallet.balance += transaction.amount;
      }
      await wallet.save();
    }

    await transaction.deleteOne();
    res.json({ message: 'Đã xóa giao dịch thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  deleteTransaction
};
