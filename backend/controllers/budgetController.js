const Budget = require('../models/Budget');

// @desc    Lấy danh sách ngân sách tháng hiện tại
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // Định dạng YYYY-MM
    // Đồng bộ hoàn toàn với ID user đăng nhập của người A (hỗ trợ cả .id hoặc ._id)
    const userId = req.user.id || req.user._id;

    const budgets = await Budget.find({ user: userId, month: currentMonth });

    // Trả về dữ liệu đắp vào table của bạn
    const budgetsWithExpense = budgets.map(budget => ({
      _id: budget._id,
      category: budget.category,
      amount: budget.amount,
      totalExpense: 0, // Mặc định chi tiêu bằng 0, có thể nâng cấp tính toán sau
      month: budget.month
    }));

    res.json(budgetsWithExpense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ Backend' });
  }
};

// @desc    Thêm mới ngân sách
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res) => {
  const { category, amount } = req.body;
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const userId = req.user.id || req.user._id;

    let budget = await Budget.findOne({ user: userId, category, month: currentMonth });
    if (budget) {
      return res.status(400).json({ message: 'Danh mục này đã được cài đặt hạn mức!' });
    }

    budget = new Budget({
      user: userId,
      category,
      amount: Number(amount),
      month: currentMonth
    });

    await budget.save();
    res.status(201).json(budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi thêm ngân sách' });
  }
};

// @desc    Xóa ngân sách
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res) => {
  try {
    await Budget.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa ngân sách thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi xóa ngân sách' });
  }
};

module.exports = {
  getBudgets,
  createBudget,
  deleteBudget
};