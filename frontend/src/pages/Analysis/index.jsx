import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, CalendarRange,
  CircleDollarSign, Landmark, Minus, ReceiptText, Sparkles
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip as RechartsTooltip, XAxis, YAxis
} from 'recharts';
import { getBehaviorAnalytics } from '../../services/analyticsService';

const COLORS = ['#4f46e5', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#f43f5e', '#64748b'];
const CATEGORY_LABELS = {
  food: 'Ăn uống', transport: 'Di chuyển', shopping: 'Mua sắm', bills: 'Hóa đơn',
  entertainment: 'Giải trí', salary: 'Lương', other: 'Khác'
};
const QUARTERS = [1, 2, 3, 4];

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');
const formatPercent = (value) => value === null
  ? 'Mới phát sinh'
  : `${value > 0 ? '+' : ''}${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value || 0)}%`;
const categoryLabel = (name) => CATEGORY_LABELS[name] || name;

const ChangeBadge = ({ value, inverse = false }) => {
  if (value === null) return <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600">Mới phát sinh</span>;
  const isGood = inverse ? value < 0 : value > 0;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const tone = value === 0 ? 'bg-gray-100 text-gray-500' : isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600';
  return <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${tone}`}><Icon className="h-3.5 w-3.5" />{formatPercent(value)}</span>;
};

const MetricCard = ({ label, value, type = 'money', icon: Icon, tone, change, inverse }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="mt-2 truncate text-xl font-black text-gray-900 dark:text-white md:text-2xl">
          {type === 'money' ? formatMoney(value) : formatNumber(value)}
        </p>
        {change !== undefined && <div className="mt-2"><ChangeBadge value={change} inverse={inverse} /></div>}
      </div>
      <span className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></span>
    </div>
  </div>
);

const Analysis = () => {
  const now = new Date();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('quarter');
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [comparison, setComparison] = useState('none');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getBehaviorAnalytics({ period, quarter, year, comparison, signal: controller.signal });
        setAnalysisData(response);
      } catch (requestError) {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(requestError.response?.data?.message || 'Không thể tải dữ liệu phân tích.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchAnalysis();
    return () => controller.abort();
  }, [period, quarter, year, comparison, retryNonce]);

  const changeMode = (nextPeriod) => {
    setPeriod(nextPeriod);
    setComparison('none');
  };

  const pieData = useMemo(() => (analysisData?.current.categoryData || []).map((item, index) => ({
    ...item,
    label: categoryLabel(item.name),
    color: COLORS[index % COLORS.length]
  })), [analysisData]);

  const insights = useMemo(() => {
    if (!analysisData?.hasData) return [];
    const messages = [];
    const { current, previous, comparison: comparisonData } = analysisData;
    if (comparisonData && previous) {
      if (comparisonData.expenseChangePercent === null) {
        messages.push(`${current.label} bắt đầu phát sinh chi tiêu trong khi ${previous.label} chưa có chi tiêu.`);
      } else {
        const direction = comparisonData.expenseChangePercent > 0 ? 'tăng' : comparisonData.expenseChangePercent < 0 ? 'giảm' : 'không thay đổi';
        const amount = Math.abs(comparisonData.expenseChangePercent);
        messages.push(`Chi tiêu ${current.label} ${direction}${direction === 'không thay đổi' ? '' : ` ${formatPercent(amount).replace('+', '')}`} so với ${previous.label}.`);
      }
    }
    if (current.highlights.topCategory) {
      const top = current.highlights.topCategory;
      messages.push(`${categoryLabel(top.name)} là danh mục chi nhiều nhất, chiếm ${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(top.percentage)}% tổng chi.`);
    }
    if (current.highlights.highestExpenseMonth) {
      messages.push(`${current.highlights.highestExpenseMonth.name} có mức chi cao nhất kỳ, đạt ${formatMoney(current.highlights.highestExpenseMonth.expense)}.`);
    }
    const categoryChanges = comparisonData?.categories?.filter((item) => item.change !== 0 && item.changePercent !== null) || [];
    const strongestIncrease = [...categoryChanges].filter((item) => item.change > 0).sort((a, b) => b.changePercent - a.changePercent)[0];
    const strongestDecrease = [...categoryChanges].filter((item) => item.change < 0).sort((a, b) => a.changePercent - b.changePercent)[0];
    if (strongestIncrease) messages.push(`${categoryLabel(strongestIncrease.name)} là danh mục tăng chi mạnh nhất (${formatPercent(strongestIncrease.changePercent)}).`);
    if (strongestDecrease) messages.push(`${categoryLabel(strongestDecrease.name)} là danh mục giảm chi mạnh nhất (${formatPercent(Math.abs(strongestDecrease.changePercent)).replace('+', '')}).`);
    return messages.slice(0, 5);
  }, [analysisData]);

  const current = analysisData?.current;
  const previous = analysisData?.previous;
  const comparisonData = analysisData?.comparison;
  const periodLabel = period === 'quarter' ? `Quý ${quarter}/${year}` : `năm ${year}`;

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white md:text-2xl">Phân tích tài chính</h1>
            <p className="mt-1 text-sm text-gray-500">Phân tích xu hướng thu chi dài hạn theo quý và năm</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
              <button type="button" onClick={() => changeMode('quarter')} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${period === 'quarter' ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-700' : 'text-gray-500'}`}>Theo quý</button>
              <button type="button" onClick={() => changeMode('year')} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${period === 'year' ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-700' : 'text-gray-500'}`}>Theo năm</button>
            </div>
            {period === 'quarter' && (
              <select value={quarter} onChange={(event) => setQuarter(Number(event.target.value))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold dark:border-gray-700 dark:bg-gray-900">
                {QUARTERS.map((item) => <option key={item} value={item}>Quý {item}</option>)}
              </select>
            )}
            <input aria-label="Năm phân tích" type="number" min="2000" max="2100" value={year} onChange={(event) => setYear(Number(event.target.value))} className="w-28 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold dark:border-gray-700 dark:bg-gray-900" />
            <select value={comparison} onChange={(event) => setComparison(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold dark:border-gray-700 dark:bg-gray-900">
              <option value="none">Không so sánh</option>
              {period === 'quarter' ? (
                <><option value="previousQuarter">Quý trước</option><option value="sameQuarterLastYear">Cùng quý năm trước</option></>
              ) : <option value="previousYear">Năm trước</option>}
            </select>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          <span>{error}</span><button type="button" onClick={() => setRetryNonce((value) => value + 1)} className="underline">Thử lại</button>
        </div>
      )}

      {loading && !analysisData ? <LoadingState /> : current && (
        <>
          {!analysisData.hasData && (
            <section className="rounded-3xl border border-dashed border-indigo-200 bg-white px-6 py-12 text-center shadow-sm dark:border-indigo-900 dark:bg-gray-900">
              <CalendarRange className="mx-auto h-12 w-12 text-indigo-400" />
              <h2 className="mt-4 text-lg font-black text-gray-800 dark:text-white">Chưa có dữ liệu tài chính trong {periodLabel}</h2>
              <p className="mt-1 text-sm text-gray-500">Các biểu đồ và nhận xét sẽ xuất hiện khi kỳ này có giao dịch thực tế.</p>
              <button type="button" onClick={() => navigate('/transactions')} className="mt-5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700">Thêm giao dịch</button>
            </section>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Tổng thu nhập" value={current.totals.income} icon={CircleDollarSign} tone="bg-emerald-50 text-emerald-600" change={comparisonData?.incomeChangePercent} />
            <MetricCard label="Tổng chi tiêu" value={current.totals.expense} icon={ReceiptText} tone="bg-rose-50 text-rose-600" change={comparisonData?.expenseChangePercent} inverse />
            <MetricCard label="Chênh lệch thu - chi" value={current.totals.balance} icon={Landmark} tone="bg-indigo-50 text-indigo-600" change={comparisonData?.balanceChangePercent} />
            <MetricCard label="Số giao dịch" value={current.totals.transactionCount} type="number" icon={BarChart3} tone="bg-amber-50 text-amber-600" change={comparisonData?.transactionCountChangePercent} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
            <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4">
                <h2 className="font-extrabold text-gray-900 dark:text-white">Thu nhập và chi tiêu theo tháng</h2>
                <p className="text-xs text-gray-400">{current.label} · Tháng không có giao dịch được hiển thị bằng 0</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={current.trendData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis width={58} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)} />
                    <RechartsTooltip formatter={(value) => formatMoney(value)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={34} />
                    <Bar dataKey="expense" name="Chi tiêu" fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="font-extrabold text-gray-900 dark:text-white">Cơ cấu chi tiêu</h2>
              <p className="text-xs text-gray-400">Theo danh mục trong {current.label}</p>
              {pieData.length ? (
                <div className="mt-3">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={pieData} dataKey="value" nameKey="label" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">{pieData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><RechartsTooltip formatter={(value) => formatMoney(value)} /></PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    {pieData.slice(0, 6).map((item) => <li key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate font-semibold text-gray-600 dark:text-gray-300">{item.label}</span></span><strong>{formatPercent(item.percentage).replace('+', '')}</strong></li>)}
                  </ul>
                </div>
              ) : <SmallEmpty text="Kỳ này chưa có giao dịch chi tiêu." />}
            </section>
          </div>

          {previous && comparisonData && (
            <ComparisonSection current={current} previous={previous} comparison={comparisonData} />
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/40 dark:to-gray-900">
              <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-600" /><h2 className="font-extrabold text-gray-900 dark:text-white">Phân tích & Nhận xét</h2></div>
              {insights.length ? <ul className="mt-3 space-y-2">{insights.map((message) => <li key={message} className="rounded-xl bg-white/80 p-3 text-sm text-gray-600 shadow-sm dark:bg-gray-800/70 dark:text-gray-300">{message}</li>)}</ul> : <SmallEmpty text="Chưa đủ dữ liệu để phân tích." />}
            </section>

            <section className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:to-gray-900">
              <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /><h2 className="font-extrabold text-gray-900 dark:text-white">Cảnh báo tài chính</h2></div>
              {(analysisData.budgetWarnings || []).length ? <ul className="mt-3 space-y-2">{analysisData.budgetWarnings.map((warning) => <li key={`${warning.month}-${warning.category}`} className="rounded-xl bg-white/80 p-3 text-sm text-gray-600 shadow-sm dark:bg-gray-800/70 dark:text-gray-300"><strong>{categoryLabel(warning.category)}</strong> ({warning.month}): {warning.exceededBy > 0 ? `vượt ngân sách ${formatMoney(warning.exceededBy)}` : `đã sử dụng ${formatPercent(warning.percentage).replace('+', '')} ngân sách`}.</li>)}</ul> : <SmallEmpty text="Không có cảnh báo ngân sách trong kỳ." />}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

const ComparisonSection = ({ current, previous, comparison }) => (
  <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div><h2 className="font-extrabold text-gray-900 dark:text-white">So sánh kỳ</h2><p className="text-xs text-gray-400">{current.label} so với {previous.label}</p></div>
      <div className="flex gap-2 text-xs"><ChangeBadge value={comparison.expenseChangePercent} inverse /><span className="self-center text-gray-400">mức chi tiêu</span></div>
    </div>
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400"><tr><th className="py-3">Danh mục</th><th className="py-3 text-right">{previous.label}</th><th className="py-3 text-right">{current.label}</th><th className="py-3 text-right">Chênh lệch</th><th className="py-3 text-right">Thay đổi</th></tr></thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {comparison.categories.length ? comparison.categories.map((item) => <tr key={item.name}><td className="py-3 font-bold text-gray-700 dark:text-gray-200">{categoryLabel(item.name)}</td><td className="py-3 text-right text-gray-500">{formatMoney(item.previousValue)}</td><td className="py-3 text-right font-semibold">{formatMoney(item.currentValue)}</td><td className={`py-3 text-right font-semibold ${item.change > 0 ? 'text-rose-600' : item.change < 0 ? 'text-emerald-600' : 'text-gray-500'}`}>{item.change > 0 ? '+' : item.change < 0 ? '−' : ''}{formatMoney(Math.abs(item.change))}</td><td className="py-3 text-right"><ChangeBadge value={item.changePercent} inverse /></td></tr>) : <tr><td colSpan="5" className="py-8 text-center text-gray-400">Hai kỳ chưa có chi tiêu để so sánh.</td></tr>}
        </tbody>
      </table>
    </div>
  </section>
);

const SmallEmpty = ({ text }) => <div className="mt-3 flex min-h-24 items-center justify-center rounded-2xl bg-white/60 px-4 text-center text-sm font-medium text-gray-400 dark:bg-gray-800/50">{text}</div>;
const LoadingState = () => <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />)}</div>;

export default Analysis;
