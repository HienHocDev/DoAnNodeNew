import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip as RechartsTooltip, XAxis, YAxis
} from 'recharts';
import {
  ArrowDownCircle, ArrowUpCircle, MinusCircle, Sparkles, TrendingDown,
  TrendingUp, Wallet
} from 'lucide-react';
import { getDashboardAnalytics } from '../../services/analyticsService';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#f43f5e', '#64748b'];

const comparisonLabels = {
  none: 'Không so sánh',
  previousMonth: 'Tháng trước',
  samePeriodLastYear: 'Cùng kỳ năm trước',
  previousQuarter: 'Quý trước',
  previousYear: 'Năm trước'
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const formatPercent = (value) => value === null
  ? 'Mới'
  : `${value > 0 ? '+' : ''}${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value || 0)}%`;

const getChangeTone = (value, inverse = false) => {
  if (value === null || value === 0) return 'neutral';
  const positive = inverse ? value < 0 : value > 0;
  return positive ? 'positive' : 'negative';
};

const ChangeBadge = ({ value, inverse = false }) => {
  const tone = getChangeTone(value, inverse);
  const Icon = value === null || value > 0 ? ArrowUpCircle : value < 0 ? ArrowDownCircle : MinusCircle;
  const classes = tone === 'positive'
    ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
    : tone === 'negative'
      ? 'border-rose-100 bg-rose-50 text-rose-600'
      : 'border-gray-200 bg-gray-50 text-gray-500';
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold ${classes}`}>
      <Icon className="h-3.5 w-3.5" /> {formatPercent(value)}
    </span>
  );
};

const SummaryCard = ({ label, value, change, comparisonLabel, inverse = false, dark = false }) => (
  <div className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm ${dark ? 'border-primary-500/50 bg-gradient-to-br from-primary-600 to-primary-800 text-white' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'}`}>
    <div className="relative z-10">
      <p className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'}`}>{label}</p>
      <h3 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">{formatMoney(value)}</h3>
      {comparisonLabel && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ChangeBadge value={change} inverse={inverse} />
          <span className={`text-xs font-medium ${dark ? 'text-primary-100' : 'text-gray-400'}`}>So với {comparisonLabel.toLowerCase()}</span>
        </div>
      )}
    </div>
    <Wallet className={`absolute -bottom-2 -right-2 h-20 w-20 ${dark ? 'text-white/10' : 'text-gray-100 dark:text-gray-800'}`} />
  </div>
);

const Dashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [comparisonType, setComparisonType] = useState('none');
  const { t } = useTheme();

  useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getDashboardAnalytics(selectedMonth, comparisonType);
        if (active) setAnalyticsData(response);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || t('dashboard_error_api'));
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAnalytics();
    return () => { active = false; };
  }, [selectedMonth, comparisonType, t]);

  const pieData = useMemo(() => (analyticsData?.categoryData || []).map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  })), [analyticsData]);

  const insights = useMemo(() => {
    if (!analyticsData?.previousPeriod) return ['Chọn một kỳ so sánh để xem nhận xét xu hướng tài chính.'];
    const { comparison, categoryComparison } = analyticsData;
    const messages = [
      comparison.incomeChangePercent === null
        ? 'Kỳ hiện tại bắt đầu phát sinh thu nhập mới.'
        : `Thu nhập ${comparison.incomeChangePercent >= 0 ? 'tăng' : 'giảm'} ${formatPercent(Math.abs(comparison.incomeChangePercent)).replace('+', '')} so với kỳ đối chiếu.`,
      comparison.expenseChangePercent === null
        ? 'Kỳ hiện tại bắt đầu phát sinh chi tiêu mới.'
        : `Chi tiêu ${comparison.expenseChangePercent >= 0 ? 'tăng' : 'giảm'} ${formatPercent(Math.abs(comparison.expenseChangePercent)).replace('+', '')}.`
    ];
    const measurable = categoryComparison.filter((item) => item.changePercent !== null && item.change !== 0);
    const strongestIncrease = [...measurable].filter((item) => item.change > 0).sort((a, b) => b.changePercent - a.changePercent)[0];
    const strongestDecrease = [...measurable].filter((item) => item.change < 0).sort((a, b) => a.changePercent - b.changePercent)[0];
    if (strongestIncrease) messages.push(`Danh mục tăng mạnh nhất là ${strongestIncrease.name} (${formatPercent(strongestIncrease.changePercent)}).`);
    if (strongestDecrease) messages.push(`Danh mục giảm mạnh nhất là ${strongestDecrease.name} (${formatPercent(strongestDecrease.changePercent)}).`);
    messages.push(comparison.balanceChange > 0
      ? 'Số dư đang cải thiện; nếu xu hướng tiếp tục, khả năng tích lũy sẽ tăng.'
      : comparison.balanceChange < 0
        ? 'Số dư giảm; nên rà soát các danh mục chi tiêu tăng mạnh.'
        : 'Số dư chưa thay đổi so với kỳ đối chiếu.');
    return messages;
  }, [analyticsData]);

  if (loading && !analyticsData) return <div className="py-10 text-center text-gray-500">{t('dashboard_loading')}</div>;
  if (error && !analyticsData) return <div className="py-10 text-center text-red-500">{error}</div>;

  const { summary, comparison, currentPeriod, previousPeriod, categoryComparison = [] } = analyticsData;
  const comparisonLabel = previousPeriod?.label;
  const chartData = previousPeriod ? analyticsData.comparisonTrendData : analyticsData.trendData;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-gray-800 dark:bg-gray-900">
        <div>
          <h2 className="font-extrabold text-gray-900 dark:text-white">Phân tích tài chính</h2>
          <p className="mt-0.5 text-xs text-gray-500">Dữ liệu từ giao dịch thực tế · {currentPeriod.label}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <span className="whitespace-nowrap">So sánh với:</span>
            <select value={comparisonType} onChange={(event) => setComparisonType(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900">
              {Object.entries(comparisonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-medium text-rose-600">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label={t('dashboard_total_income')} value={summary.totalIncome} change={comparison.incomeChangePercent} comparisonLabel={comparisonLabel} />
        <SummaryCard label={t('dashboard_total_expense')} value={summary.totalExpense} change={comparison.expenseChangePercent} comparisonLabel={comparisonLabel} inverse />
        <SummaryCard label={t('dashboard_current_balance')} value={summary.balance} change={comparison.balanceChangePercent} comparisonLabel={comparisonLabel} dark />
      </div>

      {previousPeriod && (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-800 dark:text-white">So sánh kỳ</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
            <PeriodBlock title="Kỳ hiện tại" period={currentPeriod} />
            <PeriodBlock title="Kỳ so sánh" period={previousPeriod} />
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Kết luận</p>
              <Conclusion label="Thu nhập" change={comparison.incomeChange} goodWhenPositive />
              <Conclusion label="Chi tiêu" change={comparison.expenseChange} />
              <Conclusion label="Số dư" change={comparison.balanceChange} goodWhenPositive />
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">{t('dashboard_expense_by_category')}</h3>
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="h-56 w-full flex-1">
              {pieData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={55} outerRadius={78} paddingAngle={4} dataKey="value" stroke="none">
                      {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatMoney(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyState text={t('dashboard_no_expense_data')} />}
            </div>
            <ul className="w-full space-y-2 rounded-2xl bg-gray-50 p-4 text-sm md:w-52 dark:bg-gray-800/60">
              {pieData.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate capitalize">{item.name}</span></span>
                  <strong>{formatMoney(item.value)}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">{previousPeriod ? 'Chi tiêu theo kỳ' : t('dashboard_income_vs_expense')}</h3>
          <p className="mb-3 text-xs text-gray-400">{previousPeriod ? `${currentPeriod.label} và ${previousPeriod.label}` : currentPeriod.label}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)} />
                <RechartsTooltip formatter={(value) => formatMoney(value)} />
                {previousPeriod ? (
                  <>
                    <Line type="monotone" dataKey="currentExpense" name={currentPeriod.label} stroke="#10b981" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="previousExpense" name={previousPeriod.label} stroke="#9ca3af" strokeWidth={2.5} strokeDasharray="6 4" dot={false} />
                  </>
                ) : (
                  <>
                    <Line type="monotone" dataKey="income" name={t('dashboard_income')} stroke="#10b981" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="expense" name={t('dashboard_expense')} stroke="#f43f5e" strokeWidth={3} dot={false} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {previousPeriod && (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Phân tích danh mục chi tiêu</h3>
          {categoryComparison.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase text-gray-400">
                  <tr><th className="py-3">Danh mục</th><th className="py-3 text-right">{previousPeriod.label}</th><th className="py-3 text-right">{currentPeriod.label}</th><th className="py-3 text-right">Thay đổi</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categoryComparison.map((item) => (
                    <tr key={item.name}>
                      <td className="py-3 font-bold capitalize text-gray-700 dark:text-gray-200">{item.name}</td>
                      <td className="py-3 text-right">{formatMoney(item.previousValue)}</td>
                      <td className="py-3 text-right">{formatMoney(item.currentValue)}</td>
                      <td className="py-3 text-right"><ChangeBadge value={item.changePercent} inverse /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState text="Chưa có chi tiêu ở hai kỳ để so sánh." />}
        </section>
      )}

      <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/30 dark:to-gray-900">
        <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-600" /><h3 className="font-extrabold text-gray-900 dark:text-white">AI Financial Summary</h3></div>
        <ul className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-2 dark:text-gray-300">
          {insights.map((message) => <li key={message} className="rounded-xl bg-white/80 p-3 shadow-sm dark:bg-gray-800/70">{message}</li>)}
        </ul>
      </section>
    </div>
  );
};

const PeriodBlock = ({ title, period }) => (
  <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-700">
    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</p>
    <h4 className="mt-1 font-extrabold text-gray-800 dark:text-white">{period.label}</h4>
    <div className="mt-3 space-y-2 text-sm">
      <div className="flex justify-between"><span className="text-gray-500">Thu</span><strong className="text-emerald-600">{formatMoney(period.income)}</strong></div>
      <div className="flex justify-between"><span className="text-gray-500">Chi</span><strong className="text-rose-600">{formatMoney(period.expense)}</strong></div>
      <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Số dư</span><strong>{formatMoney(period.balance)}</strong></div>
    </div>
  </div>
);

const Conclusion = ({ label, change, goodWhenPositive = false }) => {
  const good = goodWhenPositive ? change >= 0 : change <= 0;
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : MinusCircle;
  const direction = change > 0 ? 'tăng' : change < 0 ? 'giảm' : 'không đổi';
  return (
    <div className={`mt-2 flex items-center gap-2 text-sm font-semibold ${change === 0 ? 'text-gray-500' : good ? 'text-emerald-600' : 'text-rose-600'}`}>
      <Icon className="h-4 w-4" /> {label} {direction} {change !== 0 && formatMoney(Math.abs(change))}
    </div>
  );
};

const EmptyState = ({ text }) => <div className="flex h-full min-h-28 items-center justify-center rounded-2xl bg-gray-50 px-4 text-center text-sm font-medium text-gray-400 dark:bg-gray-800/60">{text}</div>;

export default Dashboard;
