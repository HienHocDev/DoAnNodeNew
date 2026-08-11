const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
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

const getComparisonPeriods = (range, comparisonType, customRange = null) => {
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
  if (comparisonType === 'customMonth' && customRange) {
    return {
      current: createPeriod(currentMonthStart, nextMonthStart, 'day', `Tháng ${String(range.month).padStart(2, '0')}/${range.year}`),
      previous: createPeriod(
        customRange.startDate,
        customRange.endDate,
        'day',
        `Tháng ${String(customRange.month).padStart(2, '0')}/${customRange.year}`
      )
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
    const validComparisons = ['none', 'previousMonth', 'customMonth', 'samePeriodLastYear', 'previousQuarter', 'previousYear'];
    if (!validComparisons.includes(comparisonType)) {
      return res.status(400).json({ message: 'Loại so sánh không hợp lệ' });
    }

    const customRange = comparisonType === 'customMonth' ? parseMonthRange(req.query.comparisonDate) : null;
    if (comparisonType === 'customMonth' && !customRange) {
      return res.status(400).json({ message: 'Tháng so sánh phải có định dạng YYYY-MM' });
    }
    const user = new mongoose.Types.ObjectId(req.user.id || req.user._id);
    const periods = getComparisonPeriods(range, comparisonType, customRange);
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

const createLongTermPeriod = (periodType, year, quarter) => {
  if (periodType === 'quarter') {
    const startMonth = (quarter - 1) * 3;
    return createPeriod(
      new Date(Date.UTC(year, startMonth, 1)),
      new Date(Date.UTC(year, startMonth + 3, 1)),
      'month',
      `Quý ${quarter}/${year}`
    );
  }
  return createPeriod(
    new Date(Date.UTC(year, 0, 1)),
    new Date(Date.UTC(year + 1, 0, 1)),
    'month',
    `Năm ${year}`
  );
};

const getLongTermComparisonPeriod = (periodType, year, quarter, comparisonType) => {
  if (comparisonType === 'none') return null;
  if (periodType === 'year') return createLongTermPeriod('year', year - 1);
  if (comparisonType === 'sameQuarterLastYear') return createLongTermPeriod('quarter', year - 1, quarter);
  const previousQuarterDate = new Date(Date.UTC(year, (quarter - 1) * 3 - 3, 1));
  return createLongTermPeriod(
    'quarter',
    previousQuarterDate.getUTCFullYear(),
    Math.floor(previousQuarterDate.getUTCMonth() / 3) + 1
  );
};

const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const getLongTermPeriodData = async (user, period) => {
  if (!period) return null;
  const transactions = await Transaction.find(periodMatch(user, period))
    .select('amount type category date')
    .lean();
  const totals = { income: 0, expense: 0, balance: 0, transactionCount: transactions.length };
  const categories = new Map();
  const monthly = new Map();

  transactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;
    if (transaction.type === 'income') totals.income += amount;
    if (transaction.type === 'expense') {
      totals.expense += amount;
      categories.set(transaction.category, (categories.get(transaction.category) || 0) + amount);
    }
    const key = monthKey(new Date(transaction.date));
    const bucket = monthly.get(key) || { income: 0, expense: 0, transactionCount: 0 };
    if (transaction.type === 'income') bucket.income += amount;
    if (transaction.type === 'expense') bucket.expense += amount;
    bucket.transactionCount += 1;
    monthly.set(key, bucket);
  });
  totals.balance = totals.income - totals.expense;

  const trendData = Array.from({ length: getPeriodBucketCount(period) }, (_, index) => {
    const date = new Date(Date.UTC(period.startDate.getUTCFullYear(), period.startDate.getUTCMonth() + index, 1));
    const key = monthKey(date);
    return {
      key,
      name: `T${date.getUTCMonth() + 1}`,
      ...(monthly.get(key) || { income: 0, expense: 0, transactionCount: 0 })
    };
  });
  const categoryData = Array.from(categories, ([name, value]) => ({
    name,
    value,
    percentage: totals.expense ? (value / totals.expense) * 100 : 0
  })).sort((a, b) => b.value - a.value);
  const expenseMonths = trendData.filter((item) => item.expense > 0);

  return {
    label: period.label,
    totals,
    trendData,
    categoryData,
    highlights: {
      highestExpenseMonth: expenseMonths.length ? [...expenseMonths].sort((a, b) => b.expense - a.expense)[0] : null,
      lowestExpenseMonth: expenseMonths.length ? [...expenseMonths].sort((a, b) => a.expense - b.expense)[0] : null,
      topCategory: categoryData[0] || null
    }
  };
};

const buildLongTermComparison = (current, previous) => {
  if (!previous) return null;
  const currentCategories = new Map(current.categoryData.map((item) => [item.name, item.value]));
  const previousCategories = new Map(previous.categoryData.map((item) => [item.name, item.value]));
  const categoryNames = new Set([...currentCategories.keys(), ...previousCategories.keys()]);
  const categories = Array.from(categoryNames, (name) => {
    const currentValue = currentCategories.get(name) || 0;
    const previousValue = previousCategories.get(name) || 0;
    return {
      name,
      currentValue,
      previousValue,
      change: currentValue - previousValue,
      changePercent: percentageChange(currentValue, previousValue)
    };
  }).sort((a, b) => b.currentValue - a.currentValue || b.previousValue - a.previousValue);

  return {
    incomeChange: current.totals.income - previous.totals.income,
    incomeChangePercent: percentageChange(current.totals.income, previous.totals.income),
    expenseChange: current.totals.expense - previous.totals.expense,
    expenseChangePercent: percentageChange(current.totals.expense, previous.totals.expense),
    balanceChange: current.totals.balance - previous.totals.balance,
    balanceChangePercent: percentageChange(current.totals.balance, previous.totals.balance),
    transactionCountChange: current.totals.transactionCount - previous.totals.transactionCount,
    transactionCountChangePercent: percentageChange(current.totals.transactionCount, previous.totals.transactionCount),
    categories
  };
};

const getBudgetWarnings = async (user, period, currentData) => {
  const months = currentData.trendData.map((item) => item.key);
  const budgets = await Budget.find({ user, month: { $in: months } }).select('category amount month').lean();
  if (!budgets.length) return [];
  const expenses = await Transaction.aggregate([
    { $match: { ...periodMatch(user, period), type: 'expense' } },
    { $group: { _id: { category: '$category', month: { $dateToString: { format: '%Y-%m', date: '$date', timezone: 'UTC' } } }, spent: { $sum: '$amount' } } }
  ]);
  const expenseMap = new Map(expenses.map((item) => [`${item._id.month}:${item._id.category}`, item.spent]));
  return budgets.map((budget) => {
    const spent = expenseMap.get(`${budget.month}:${budget.category}`) || 0;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    return {
      category: budget.category,
      month: budget.month,
      budget: budget.amount,
      spent,
      percentage,
      exceededBy: Math.max(spent - budget.amount, 0)
    };
  }).filter((item) => item.exceededBy > 0 || item.percentage >= 80)
    .sort((a, b) => b.percentage - a.percentage);
};

const getLongTermAnalytics = async (req, res) => {
  try {
    const periodType = req.query.period || 'quarter';
    const year = Number(req.query.year || new Date().getUTCFullYear());
    const quarter = Number(req.query.quarter || Math.floor(new Date().getUTCMonth() / 3) + 1);
    const comparisonType = req.query.comparison || 'none';
    const validComparisons = periodType === 'quarter'
      ? ['none', 'previousQuarter', 'sameQuarterLastYear']
      : ['none', 'previousYear'];

    if (!['quarter', 'year'].includes(periodType)) return res.status(400).json({ message: 'Kỳ phân tích không hợp lệ' });
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return res.status(400).json({ message: 'Năm không hợp lệ' });
    if (periodType === 'quarter' && (!Number.isInteger(quarter) || quarter < 1 || quarter > 4)) {
      return res.status(400).json({ message: 'Quý không hợp lệ' });
    }
    if (!validComparisons.includes(comparisonType)) return res.status(400).json({ message: 'Loại so sánh không hợp lệ' });

    const user = new mongoose.Types.ObjectId(req.user.id || req.user._id);
    const currentPeriod = createLongTermPeriod(periodType, year, quarter);
    const previousPeriod = getLongTermComparisonPeriod(periodType, year, quarter, comparisonType);
    const [current, previous] = await Promise.all([
      getLongTermPeriodData(user, currentPeriod),
      getLongTermPeriodData(user, previousPeriod)
    ]);
    const budgetWarnings = await getBudgetWarnings(user, currentPeriod, current);

    return res.json({
      period: periodType,
      year,
      quarter: periodType === 'quarter' ? quarter : null,
      comparisonType,
      hasData: current.totals.transactionCount > 0,
      current,
      previous,
      comparison: buildLongTermComparison(current, previous),
      budgetWarnings
    });
  } catch (err) {
    console.error('Long-term analysis error:', err);
    return res.status(500).json({ message: 'Lỗi hệ thống khi phân tích tài chính dài hạn' });
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

module.exports = { getDashboardAnalytics, getLongTermAnalytics, getMonthlyReport };
