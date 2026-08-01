const Goal = require('../models/Goal');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (value) => {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const enrichGoal = (goalDocument) => {
  const goal = goalDocument.toObject ? goalDocument.toObject() : goalDocument;
  const targetAmount = Number(goal.targetAmount) || 0;
  const currentAmount = Math.max(Number(goal.currentAmount) || 0, 0);
  const remainingAmount = Math.max(targetAmount - currentAmount, 0);
  const progress = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;

  const today = startOfUtcDay(new Date());
  const createdAt = startOfUtcDay(goal.createdAt || new Date());
  const deadline = startOfUtcDay(goal.deadline);
  const daysRemaining = Math.ceil((deadline - today) / DAY_IN_MS);
  const totalDays = Math.max(Math.ceil((deadline - createdAt) / DAY_IN_MS), 1);
  const elapsedDays = Math.min(Math.max(Math.floor((today - createdAt) / DAY_IN_MS), 0), totalDays);
  const timeProgress = Math.min((elapsedDays / totalDays) * 100, 100);

  let status;
  if (progress >= 100) status = 'Đã hoàn thành';
  else if (daysRemaining < 0) status = 'Quá hạn';
  else if (progress >= 90) status = 'Sắp hoàn thành';
  else if (progress >= timeProgress) status = 'Đúng tiến độ';
  else status = 'Có nguy cơ trễ';

  const dailyRequired = remainingAmount > 0 && daysRemaining > 0
    ? remainingAmount / daysRemaining
    : 0;

  return {
    ...goal,
    currentAmount,
    progressHistory: (goal.progressHistory || []).map((entry) => {
      const totalAfterUpdate = entry.totalAfterUpdate ?? entry.totalAmount ?? 0;
      return {
        ...entry,
        totalAmount: entry.totalAmount ?? totalAfterUpdate,
        totalAfterUpdate,
        note: entry.note || ''
      };
    }),
    remainingAmount,
    progress,
    daysRemaining,
    totalDays,
    elapsedDays,
    timeProgress,
    dailyRequired,
    weeklyRequired: dailyRequired * 7,
    monthlyRequired: dailyRequired * 30,
    status
  };
};

const getGoals = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const goals = await Goal.find({ user: userId }).sort({ deadline: 1 });
    return res.json(goals.map(enrichGoal));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy mục tiêu' });
  }
};

const createGoal = async (req, res) => {
  try {
    const { name, targetAmount, currentAmount = 0, deadline } = req.body;
    const numericTarget = Number(targetAmount);
    const numericCurrent = Number(currentAmount);
    if (!name?.trim() || !Number.isFinite(numericTarget) || numericTarget <= 0 || !deadline) {
      return res.status(400).json({ message: 'Thông tin mục tiêu không hợp lệ' });
    }
    if (!Number.isFinite(numericCurrent) || numericCurrent < 0) {
      return res.status(400).json({ message: 'Số tiền đã tích lũy không được âm' });
    }
    const parsedDeadline = new Date(deadline);
    if (Number.isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({ message: 'Hạn chót không hợp lệ' });
    }

    const now = new Date();
    const goal = await Goal.create({
      user: req.user.id || req.user._id,
      name: name.trim(),
      targetAmount: numericTarget,
      currentAmount: numericCurrent,
      deadline: parsedDeadline,
      progressHistory: numericCurrent > 0
        ? [{
            amountAdded: numericCurrent,
            totalAmount: numericCurrent,
            totalAfterUpdate: numericCurrent,
            note: '',
            date: now
          }]
        : []
    });
    return res.status(201).json(enrichGoal(goal));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi khi tạo mục tiêu' });
  }
};

const updateGoalAmount = async (req, res) => {
  try {
    const numericAmount = Number(req.body.amountToAdd);
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Số tiền muốn thêm phải là số dương' });
    }
    if (note.length > 120) {
      return res.status(400).json({ message: 'Ghi chú không được vượt quá 120 ký tự' });
    }

    const now = new Date();
    const goal = await Goal.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id || req.user._id,
        currentAmount: { $gte: 0 }
      },
      [{
        $set: {
          currentAmount: { $add: [{ $ifNull: ['$currentAmount', 0] }, numericAmount] },
          progressHistory: {
            $concatArrays: [
              { $ifNull: ['$progressHistory', []] },
              [{
                amountAdded: numericAmount,
                totalAmount: { $add: [{ $ifNull: ['$currentAmount', 0] }, numericAmount] },
                totalAfterUpdate: { $add: [{ $ifNull: ['$currentAmount', 0] }, numericAmount] },
                note,
                date: now
              }]
            ]
          }
        }
      }],
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: 'Không tìm thấy mục tiêu hợp lệ' });
    return res.json(enrichGoal(goal));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi khi cập nhật mục tiêu' });
  }
};

const updateGoalDetails = async (req, res) => {
  try {
    const { name, targetAmount, deadline } = req.body;
    const numericTarget = Number(targetAmount);
    const parsedDeadline = new Date(deadline);
    if (!name?.trim() || !Number.isFinite(numericTarget) || numericTarget <= 0 || Number.isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({ message: 'Thông tin mục tiêu không hợp lệ' });
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id || req.user._id },
      { $set: { name: name.trim(), targetAmount: numericTarget, deadline: parsedDeadline } },
      { new: true, runValidators: true }
    );
    if (!goal) return res.status(404).json({ message: 'Không tìm thấy mục tiêu' });
    return res.json(enrichGoal(goal));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi khi sửa mục tiêu' });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id || req.user._id
    });
    if (!goal) return res.status(404).json({ message: 'Không tìm thấy mục tiêu' });
    return res.json({ message: 'Đã xóa mục tiêu thành công' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi khi xóa mục tiêu' });
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoalAmount,
  updateGoalDetails,
  deleteGoal
};
