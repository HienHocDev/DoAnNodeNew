const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

const CATEGORY_ALIASES = {
  food: 'food', 'an uong': 'food',
  transport: 'transport', 'di chuyen': 'transport',
  shopping: 'shopping', 'mua sam': 'shopping',
  entertainment: 'entertainment', 'giai tri': 'entertainment',
  bills: 'bills', 'hoa don': 'bills',
  other: 'other', khac: 'other'
};

const normalizeCategory = (category = '') => {
  const value = String(category)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
  return CATEGORY_ALIASES[value] || value;
};

const parseMonth = (value) => {
  const monthValue = value || new Date().toISOString().slice(0, 7);
  const match = /^(\d{4})-(\d{2})$/.exec(monthValue);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));
  const previousStartDate = new Date(Date.UTC(year, month - 2, 1));
  const previousMonth = `${previousStartDate.getUTCFullYear()}-${String(previousStartDate.getUTCMonth() + 1).padStart(2, '0')}`;
  return { value: monthValue, startDate, endDate, previousStartDate, previousMonth };
};

const getSpentByCategory = async (userId, startDate, endDate) => {
  const expenses = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: { $gte: startDate, $lt: endDate }
      }
    },
    { $group: { _id: '$category', total: { $sum: '$amount' } } }
  ]);

  return expenses.reduce((result, item) => {
    const category = normalizeCategory(item._id);
    result[category] = (result[category] || 0) + Number(item.total || 0);
    return result;
  }, {});
};

const getBudgets = async (req, res) => {
  try {
    const range = parseMonth(req.query.month);
    if (!range) return res.status(400).json({ message: 'Tháng ngân sách không hợp lệ' });

    const userId = req.user.id || req.user._id;
    const [budgets, currentSpent, previousSpent] = await Promise.all([
      Budget.find({ user: userId, month: range.value }).sort({ category: 1 }),
      getSpentByCategory(userId, range.startDate, range.endDate),
      getSpentByCategory(userId, range.previousStartDate, range.startDate)
    ]);

    const result = budgets.map((budget) => {
      const category = normalizeCategory(budget.category);
      const spent = currentSpent[category] || 0;
      const previousMonthSpent = previousSpent[category] || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const changeAmount = spent - previousMonthSpent;
      const changePercent = previousMonthSpent > 0
        ? (changeAmount / previousMonthSpent) * 100
        : null;

      return {
        _id: budget._id,
        category,
        amount: budget.amount,
        month: budget.month,
        spent,
        remaining,
        percentage,
        previousMonthSpent,
        previousMonth: range.previousMonth,
        changeAmount,
        changePercent
      };
    });

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy ngân sách' });
  }
};

const createBudget = async (req, res) => {
  try {
    const range = parseMonth(req.body.month);
    const amount = Number(req.body.amount);
    const category = normalizeCategory(req.body.category);
    if (!range || !CATEGORY_ALIASES[category] || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Thông tin ngân sách không hợp lệ' });
    }

    const userId = req.user.id || req.user._id;
    const existingBudgets = await Budget.find({ user: userId, month: range.value });
    const duplicate = existingBudgets.some((budget) => normalizeCategory(budget.category) === category);
    if (duplicate) {
      const [year, month] = range.value.split('-');
      return res.status(409).json({
        message: `Danh mục này đã có ngân sách trong tháng ${month}/${year}.`
      });
    }

    const budget = await Budget.create({
      user: userId,
      category,
      amount,
      month: range.value
    });
    return res.status(201).json(budget);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi khi thêm ngân sách' });
  }
};

const updateBudget = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Hạn mức phải là số lớn hơn 0' });
    }

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id || req.user._id },
      { $set: { amount } },
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ message: 'Không tìm thấy ngân sách' });
    return res.json(budget);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi khi sửa ngân sách' });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id || req.user._id
    });
    if (!budget) return res.status(404).json({ message: 'Không tìm thấy ngân sách' });
    return res.json({ message: 'Đã xóa ngân sách thành công' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi khi xóa ngân sách' });
  }
};

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  normalizeCategory
};
