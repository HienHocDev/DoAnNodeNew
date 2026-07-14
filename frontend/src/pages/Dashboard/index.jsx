import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { getDashboardAnalytics } from '../../services/analyticsService';
import { useTheme } from '../../context/ThemeContext';

const Dashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { t } = useTheme();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getDashboardAnalytics(selectedMonth);
        setAnalyticsData(res);
      } catch (err) {
        setError(t('dashboard_error_api'));
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedMonth, t]);

  if (loading) return <div className="text-center py-10 text-gray-500">{t('dashboard_loading')}</div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;

  // Mảng màu sắc dự phòng để tự động gán nếu không tìm thấy key trùng khớp
  const PREDEFINED_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#ff6b6b', '#06b6d4', '#f43f5e'];

  // Bảng mapping linh hoạt hỗ trợ cả tiếng Anh lẫn tiếng Việt
  const colorMapping = {
    // Tiếng Anh (Dữ liệu thực tế của bạn)
    'food': '#3b82f6',
    'transport': '#8b5cf6',
    'shopping': '#f59e0b',
    'bills': '#10b981',
    'entertainment': '#ec4899',
    'other': '#6b7280',
    
    // Tiếng Việt phòng hờ
    'Ăn uống': '#3b82f6',
    'Di chuyển': '#8b5cf6',
    'Mua sắm': '#f59e0b',
    'Hóa đơn': '#10b981',
    'Giải trí': '#ec4899',
    'Khác': '#6b7280'
  };

  // Đổ dữ liệu thật từ API vào pieData kèm xử lý màu thông minh
  const pieData = analyticsData.categoryData.map((item, index) => {
    // Tìm màu theo tên danh mục (chuyển về viết thường để so khớp chính xác nhất)
    const normalizedName = item.name ? item.name.toLowerCase().trim() : '';
    let assignedColor = colorMapping[item.name] || colorMapping[normalizedName];

    // Nếu là danh mục mới hoàn toàn không có trong danh sách, tự gán tuần hoàn theo mảng màu
    if (!assignedColor) {
      assignedColor = PREDEFINED_COLORS[index % PREDEFINED_COLORS.length];
    }

    return {
      name: item.name,
      value: item.value,
      color: assignedColor
    };
  });

  // Đổ dữ liệu thật từ API vào lineData
  const lineData = analyticsData.trendData.map(item => ({
    date: item.name,
    income: item.income,
    expense: item.expense
  }));

  const { summary } = analyticsData;
  const formatChange = (value) => value === null ? 'Mới' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-end">
        <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 bg-white dark:bg-gray-900 dark:text-white" />
      </div>
      {/* Cards Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Income Card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-soft hover:-translate-y-1 flex items-center justify-between group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wide uppercase">{t('dashboard_total_income')}</p>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{summary.totalIncome.toLocaleString('vi-VN')}đ</h3>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg mt-3 border ${summary.incomeChange === null || summary.incomeChange >= 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
              {summary.incomeChange === null || summary.incomeChange >= 0 ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
              <span>{formatChange(summary.incomeChange)}</span>
            </div>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-500/20 dark:to-primary-500/10 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10">
            <Wallet className="w-7 h-7" />
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-soft hover:-translate-y-1 flex items-center justify-between group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wide uppercase">{t('dashboard_total_expense')}</p>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{summary.totalExpense.toLocaleString('vi-VN')}đ</h3>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg mt-3 border ${summary.expenseChange !== null && summary.expenseChange > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
              {summary.expenseChange !== null && summary.expenseChange > 0 ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
              <span>{formatChange(summary.expenseChange)}</span>
            </div>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-500/20 dark:to-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 relative z-10">
            <Wallet className="w-7 h-7" />
          </div>
        </div>

        {/* Current Balance Card */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-6 rounded-[24px] shadow-lg shadow-primary-500/30 transition-all duration-300 hover:-translate-y-1 flex items-center justify-between group relative overflow-hidden text-white border border-primary-500/50">
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-primary-100 mb-2 tracking-wide uppercase">{t('dashboard_current_balance')}</p>
            <h3 className="text-3xl font-extrabold tracking-tight">
              {summary.balance.toLocaleString('vi-VN')}đ
            </h3>
            <p className="text-sm text-primary-200 font-medium mt-3 flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
               Updated today
            </p>
          </div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 relative z-10 border border-white/20">
            <Wallet className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Biểu đồ tròn */}
        <div className="bg-white dark:bg-gray-900 p-7 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-soft">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">{t('dashboard_expense_by_category')}</h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-64 flex-1 w-full">
              {pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400 font-medium bg-gray-50 dark:bg-gray-800/50 rounded-2xl">{t('dashboard_no_expense_data')}</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => `${value.toLocaleString('vi-VN')}đ`} 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: '600', backgroundColor: 'var(--tw-colors-gray-900)', color: 'white' }}
                      itemStyle={{ color: 'white' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="w-full md:w-56 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              <ul className="space-y-4">
                {pieData.map((item, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium max-w-[100px] truncate capitalize">{item.name}</span>
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">{item.value.toLocaleString('vi-VN')}đ</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Biểu đồ đường */}
        <div className="bg-white dark:bg-gray-900 p-7 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-soft">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">{t('dashboard_income_vs_expense')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 13, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 13, fontWeight: 500}} tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)} dx={-10} />
                <RechartsTooltip 
                  formatter={(value) => `${value.toLocaleString('vi-VN')}đ`}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: '600', backgroundColor: 'var(--tw-colors-gray-900)', color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Line type="monotone" dataKey="income" name={t('dashboard_income')} stroke="#10b981" strokeWidth={4} dot={{r: 0}} activeDot={{r: 8, strokeWidth: 0, fill: '#10b981'}} />
                <Line type="monotone" dataKey="expense" name={t('dashboard_expense')} stroke="#f43f5e" strokeWidth={4} dot={{r: 0}} activeDot={{r: 8, strokeWidth: 0, fill: '#f43f5e'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
