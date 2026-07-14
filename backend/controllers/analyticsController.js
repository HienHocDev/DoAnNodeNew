const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

const parseMonthRange = (date) => {
  const value = date || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  const [year, month] = value.split('-').map(Number);
  return {
    value, year, month,
    startDate: new Date(Date.UTC(year, month - 1, 1)),
    endDate: new Date(Date.UTC(year, month, 1)),
    previousStartDate: new Date(Date.UTC(year, month - 2, 1))
  };
};

const percentageChange = (current, previous) => previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / previous) * 100;

const totalsByType = (rows) => rows.reduce((result, item) => {
  if (item._id === 'income') result.totalIncome = item.total;
  if (item._id === 'expense') result.totalExpense = item.total;
  return result;
}, { totalIncome: 0, totalExpense: 0 });

const getDashboardAnalytics = async (req, res) => {
  try {
    const range = parseMonthRange(req.query.date);
    if (!range) return res.status(400).json({ message: 'Tháng phải có định dạng YYYY-MM' });
    const user = new mongoose.Types.ObjectId(req.user.id || req.user._id);
    const currentMatch = { user, date: { $gte: range.startDate, $lt: range.endDate } };
    const previousMatch = { user, date: { $gte: range.previousStartDate, $lt: range.startDate } };

    const [currentRows, previousRows, categoryData, dailyRows] = await Promise.all([
      Transaction.aggregate([{ $match: currentMatch }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: previousMatch }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
      Transaction.aggregate([
        { $match: { ...currentMatch, type: 'expense' } },
        { $group: { _id: '$category', value: { $sum: '$amount' } } },
        { $project: { name: '$_id', value: 1, _id: 0 } }, { $sort: { value: -1 } }
      ]),
      Transaction.aggregate([
        { $match: currentMatch },
        { $group: { _id: { day: { $dayOfMonth: '$date' }, type: '$type' }, total: { $sum: '$amount' } } }
      ])
    ]);
    const current = totalsByType(currentRows);
    const previous = totalsByType(previousRows);
    const dailyMap = new Map(dailyRows.map(item => [`${item._id.day}-${item._id.type}`, item.total]));
    const days = new Date(Date.UTC(range.year, range.month, 0)).getUTCDate();
    const trendData = Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      return {
        name: `${String(day).padStart(2, '0')}/${String(range.month).padStart(2, '0')}`,
        income: dailyMap.get(`${day}-income`) || 0,
        expense: dailyMap.get(`${day}-expense`) || 0
      };
    });

    return res.json({
      month: range.value,
      summary: {
        ...current,
        balance: current.totalIncome - current.totalExpense,
        incomeChange: percentageChange(current.totalIncome, previous.totalIncome),
        expenseChange: percentageChange(current.totalExpense, previous.totalExpense)
      },
      categoryData, trendData
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi hệ thống khi tính toán thống kê' });
  }
};

const getBehaviorAnalytics = async (req, res) => {
  try {
    const range = parseMonthRange(req.query.date);
    if (!range) return res.status(400).json({ message: 'Tháng phải có định dạng YYYY-MM' });
    const user = new mongoose.Types.ObjectId(req.user.id || req.user._id);
    const [expenses, previousExpenses] = await Promise.all([
      Transaction.find({ user, type: 'expense', date: { $gte: range.startDate, $lt: range.endDate } }).sort({ date: 1 }).lean(),
      Transaction.find({ user, type: 'expense', date: { $gte: range.previousStartDate, $lt: range.startDate } }).select('amount').lean()
    ]);
    const currentTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
    const previousTotal = previousExpenses.reduce((sum, item) => sum + item.amount, 0);
    const categoryMap = expenses.reduce((map, item) => {
      map[item.category] = (map[item.category] || 0) + item.amount;
      return map;
    }, {});
    const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
    const dailyTotals = expenses.reduce((map, item) => {
      const day = new Date(item.date).getUTCDate();
      map[day] = (map[day] || 0) + item.amount;
      return map;
    }, {});
    const days = new Date(Date.UTC(range.year, range.month, 0)).getUTCDate();
    const miniChartData = Array.from({ length: days }, (_, i) => ({ day: i + 1, value: dailyTotals[i + 1] || 0 }));

    // Midnight cannot be distinguished from a date-only form value, so it is excluded from time-of-day analysis.
    const withTime = expenses.filter(item => {
      const value = new Date(item.date);
      return value.getUTCHours() || value.getUTCMinutes() || value.getUTCSeconds();
    });
    const slots = [
      { name: 'Buổi sáng', slot: '(06h - 12h)', total: 0 }, { name: 'Buổi chiều', slot: '(12h - 18h)', total: 0 },
      { name: 'Buổi tối', slot: '(18h - 22h)', total: 0 }, { name: 'Ban đêm', slot: '(22h - 06h)', total: 0 }
    ];
    withTime.forEach(item => {
      // Transaction forms store local Vietnam time as UTC; convert back before assigning a slot.
      const hour = (new Date(item.date).getUTCHours() + 7) % 24;
      const index = hour >= 6 && hour < 12 ? 0 : hour >= 12 && hour < 18 ? 1 : hour >= 18 && hour < 22 ? 2 : 3;
      slots[index].total += item.amount;
    });
    const topSlot = withTime.length ? slots.sort((a, b) => b.total - a.total)[0] : null;

    return res.json({
      month: range.value,
      trendPercentage: percentageChange(currentTotal, previousTotal),
      miniChartData,
      topCategory: topCategory ? { name: topCategory[0], percentage: Math.round((topCategory[1] / currentTotal) * 100) } : { name: 'Chưa có dữ liệu', percentage: 0 },
      topTimeSlot: topSlot ? { name: topSlot.name, slot: topSlot.slot } : { name: 'Chưa đủ dữ liệu', slot: '' }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi hệ thống khi phân tích hành vi' });
  }
};

const getMonthlyReport = async (req, res) => {
  try {
    const range = parseMonthRange(req.query.date);
    const type = req.query.type || 'expense';
    if (!range) return res.status(400).json({ message: 'Tháng phải có định dạng YYYY-MM' });
    if (!['expense', 'income', 'all'].includes(type)) return res.status(400).json({ message: 'Loại báo cáo không hợp lệ' });
    const match = { user: new mongoose.Types.ObjectId(req.user.id || req.user._id), date: { $gte: range.startDate, $lt: range.endDate } };
    if (type !== 'all') match.type = type;
    const rows = await Transaction.aggregate([
      { $match: match }, { $group: { _id: type === 'all' ? '$type' : '$category', value: { $sum: '$amount' } } }, { $sort: { value: -1 } }
    ]);
    const totalAmount = rows.reduce((sum, item) => sum + item.value, 0);
    const totals = type === 'all'
      ? totalsByType(rows.map(item => ({ _id: item._id, total: item.value })))
      : { totalIncome: type === 'income' ? totalAmount : 0, totalExpense: type === 'expense' ? totalAmount : 0 };
    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6b7280'];
    const reportData = rows.map((item, index) => ({
      name: type === 'all' ? (item._id === 'expense' ? 'Tổng Chi tiêu' : 'Tổng Thu nhập') : item._id,
      value: item.value,
      percentage: `${totalAmount ? ((item.value / totalAmount) * 100).toFixed(1) : 0}%`,
      color: type === 'all' ? (item._id === 'expense' ? '#ef4444' : '#10b981') : colors[index % colors.length]
    }));
    return res.json({ totalAmount, ...totals, difference: totals.totalIncome - totals.totalExpense, reportData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lỗi hệ thống khi lấy dữ liệu báo cáo' });
  }
};

module.exports = { getDashboardAnalytics, getBehaviorAnalytics, getMonthlyReport };
