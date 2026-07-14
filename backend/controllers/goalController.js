const Goal = require('../models/Goal');

// @desc    Lấy tất cả mục tiêu của user
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const goals = await Goal.find({ user: userId });
    res.json(goals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy mục tiêu' });
  }
};

// @desc    Thêm mục tiêu mới
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res) => {
  const { name, targetAmount, currentAmount, deadline } = req.body;
  try {
    const userId = req.user.id || req.user._id;
    const newGoal = new Goal({
      user: userId,
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      deadline
    });

    const goal = await newGoal.save();
    res.status(201).json(goal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi tạo mục tiêu' });
  }
};

// @desc    Cập nhật số tiền hiện tại của mục tiêu (Tích lũy thêm tiền)
// @route   PUT /api/goals/:id
// @access  Private
const updateGoalAmount = async (req, res) => {
  const { currentAmount } = req.body;
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Không tìm thấy mục tiêu' });

    goal.currentAmount = Number(currentAmount);
    await goal.save();
    res.json(goal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật mục tiêu' });
  }
};

// @desc    Xóa mục tiêu
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa mục tiêu thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi xóa mục tiêu' });
  }
};

module.exports = { getGoals, createGoal, updateGoalAmount, deleteGoal };