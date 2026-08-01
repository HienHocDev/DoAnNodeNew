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

const createPeriod = (startDate, endDate, unit, label) => ({ startDate, endDate, unit, label });

const getComparisonPeriods = (range, comparisonType) => {
  const currentMonthStart = range.startDate;
  const nextMonthStart = range.endDate;
  if (comparisonType === 'none') {
    return {
      current: createPeriod(currentMonthStart, nextMonthStart, 'day', `Tháng ${String(range.month).padStart(2, '0')}/${range.year}`),
      previous: null
    };
  }
  if (comparisonType === 'previousMonth') {
    const previousStart = new Date(Date.UTC(range.year, range.month - 2, 1));
    return {
      current: createPeriod(currentMonthStart, nextMonthStart, 'day', `Tháng ${String(range.month).padStart(2, '0')}/${range.year}`),
      previous: createPeriod(previousStart, currentMonthStart, 'day', `Tháng ${String(previousStart.getUTCMonth() + 1).padStart(2, '0')}/${previousStart.getUTCFullYear()}`)
    };
  }
  if (comparisonType === 'samePeriodLastYear') {
    const previousStart = new Date(Date.UTC(range.year - 1, range.month - 1, 1));
    const previousEnd = new Date(Date.UTC(range.year - 1, range.month, 1));
    return {
      current: createPeriod(currentMonthStart, nextMonthStart, 'day', `Tháng ${String(range.month).padStart(2, '0')}/${range.year}`),
      previous: createPeriod(previousStart, previousEnd, 'day', `Tháng ${String(range.month).padStart(2, '0')}/${range.year - 1}`)
    };
  }
  if (comparisonType === 'previousQuarter') {
    const quarterStartMonth = Math.floor((range.month - 1) / 3) * 3;
    const quarter = Math.floor(quarterStartMonth / 3) + 1;
    const currentStart = new Date(Date.UTC(range.year, quarterStartMonth, 1));
    const currentEnd = new Date(Date.UTC(range.year, quarterStartMonth + 3, 1));
    const previousStart = new Date(Date.UTC(range.year, quarterStartMonth - 3, 1));
    return {
      current: createPeriod(currentStart, currentEnd, 'month', `Quý ${quarter}/${range.year}`),
      previous: createPeriod(
        previousStart,
        currentStart,
        'month',
        `Quý ${Math.floor(previousStart.getUTCMonth() / 3) + 1}/${previousStart.getUTCFullYear()}`
      )
    };
  }

  const currentStart = new Date(Date.UTC(range.year, 0, 1));
  const currentEnd = new Date(Date.UTC(range.year + 1, 0, 1));
  const previousStart = new Date(Date.UTC(range.year - 1, 0, 1));
  return {
    current: createPeriod(currentStart, currentEnd, 'month', `Năm ${range.year}`),
    previous: createPeriod(previousStart, currentStart, 'month', `Năm ${range.year - 1}`)
  };
};

const periodMatch = (user, period) => ({
  user,
  date: { $gte: period.startDate, $lt: period.endDate }
});

const getBucketExpression = (unit) => unit === 'day'
  ? { $dayOfMonth: '$date' }
  : { $month: '$date' };

const getPeriodBucketCount = (period) => period.unit === 'day'
  ? new Date(Date.UTC(period.startDate.getUTCFullYear(), period.startDate.getUTCMonth() + 1, 0)).getUTCDate()
  : Math.round((period.endDate.getUTCFullYear() - period.startDate.getUTCFullYear()) * 12
    + period.endDate.getUTCMonth() - period.startDate.getUTCMonth());

const getPeriodAnalytics = async (user, period) => {
  if (!period) return { totals: [], categories: [], buckets: [] };
  const match = periodMatch(user, period);
  const [totals, categories, buckets] = await Promise.all([
    Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { ...match, type: 'expense' } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
      { $sort: { value: -1 } }
    ]),
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { bucket: getBucketExpression(period.unit), type: '$type' },
          total: { $sum: '$amount' }
        }
      }
    ])
  ]);
  return { totals, categories, buckets };
};

const buildTrend = (period, rows) => {
  const bucketMap = new Map(rows.map((item) => [`${item._id.bucket}-${item._id.type}`, item.total]));
  const count = getPeriodBucketCount(period);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(
      period.startDate.getUTCFullYear(),
      period.startDate.getUTCMonth() + (period.unit === 'month' ? index : 0),
      period.unit === 'day' ? index + 1 : 1
    ));
    const bucket = period.unit === 'day' ? index + 1 : date.getUTCMonth() + 1;
    return {
      name: period.unit === 'day'
        ? String(index + 1).padStart(2, '0')
        : `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`,
      income: bucketMap.get(`${bucket}-income`) || 0,
      expense: bucketMap.get(`${bucket}-expense`) || 0
    };
  });
};

const getDashboardAnalytics = async (req, res) => {
  try {
    const range = parseMonthRange(req.query.date);
    if (!range) return res.status(400).json({ message: 'Tháng phải có định dạng YYYY-MM' });
    const comparisonType = req.query.comparison || 'previousMonth';
    const validComparisons = ['none', 'previousMonth', 'samePeriodLastYear', 'previousQuarter', 'previousYear'];
    if (!validComparisons.includes(comparisonType)) {
      return res.status(400).json({ message: 'Loại so sánh không hợp lệ' });
    }

    const user = new mongoose.Types.ObjectId(req.user.id || req.user._id);
    const periods = getComparisonPeriods(range, comparisonType);
    const [currentAnalytics, previousAnalytics] = await Promise.all([
      getPeriodAnalytics(user, periods.current),
      getPeriodAnalytics(user, periods.previous)
    ]);
    const current = totalsByType(currentAnalytics.totals);
    const previous = totalsByType(previousAnalytics.totals);
    const currentBalance = current.totalIncome - current.totalExpense;
    const previousBalance = previous.totalIncome - previous.totalExpense;
    const currentTrend = buildTrend(periods.current, currentAnalytics.buckets);
    const previousTrend = periods.previous ? buildTrend(periods.previous, previousAnalytics.buckets) : [];
    const comparisonTrendData = currentTrend.map((item, index) => ({
      name: item.name,
      currentIncome: item.income,
      previousIncome: previousTrend[index]?.income || 0,
      currentExpense: item.expense,
      previousExpense: previousTrend[index]?.expense || 0
    }));

    const previousCategoryMap = new Map(previousAnalytics.categories.map((item) => [item._id, item.value]));
    const currentCategoryMap = new Map(currentAnalytics.categories.map((item) => [item._id, item.value]));
    const categoryNames = new Set([...currentCategoryMap.keys(), ...previousCategoryMap.keys()]);
    const categoryComparison = Array.from(categoryNames).map((name) => {
      const currentValue = currentCategoryMap.get(name) || 0;
      const previousValue = previousCategoryMap.get(name) || 0;
      return {
        name,
        currentValue,
        previousValue,
        change: currentValue - previousValue,
        changePercent: percentageChange(currentValue, previousValue)
      };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    const comparison = {
      currentIncome: current.totalIncome,
      previousIncome: previous.totalIncome,
      incomeChange: current.totalIncome - previous.totalIncome,
      incomeChangePercent: percentageChange(current.totalIncome, previous.totalIncome),
      currentExpense: current.totalExpense,
      previousExpense: previous.totalExpense,
      expenseChange: current.totalExpense - previous.totalExpense,
      expenseChangePercent: percentageChange(current.totalExpense, previous.totalExpense),
      currentBalance,
      previousBalance,
      balanceChange: currentBalance - previousBalance,
      balanceChangePercent: percentageChange(currentBalance, previousBalance),
      comparisonType
    };

    return res.json({
      month: range.value,
      comparisonType,
      currentPeriod: {
        label: periods.current.label,
        income: current.totalIncome,
        expense: current.totalExpense,
        balance: currentBalance
      },
      previousPeriod: periods.previous ? {
        label: periods.previous.label,
        income: previous.totalIncome,
        expense: previous.totalExpense,
        balance: previousBalance
      } : null,
      comparison,
      summary: {
        ...current,
        balance: currentBalance,
        incomeChange: comparison.incomeChangePercent,
        expenseChange: comparison.expenseChangePercent,
        balanceChange: comparison.balanceChangePercent
      },
      categoryData: currentAnalytics.categories.map((item) => ({ name: item._id, value: item.value })),
      categoryComparison,
      trendData: currentTrend,
      comparisonTrendData
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
