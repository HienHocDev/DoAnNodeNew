import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { getDashboardAnalytics } from '../../services/analyticsService';

const Dashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await getDashboardAnalytics();
        setAnalyticsData(res);
      } catch (err) {
        setError('Không thể kết nối API Tổng quan.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-500">Đang tải dữ liệu tổng quan...</div>;
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
    income: item['Thu nhập'],
    expense: item['Chi tiêu']
  }));

  const { summary } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Cards Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Tổng thu nhập</p>
            <h3 className="text-2xl font-bold text-gray-900">{summary.totalIncome.toLocaleString('vi-VN')}đ</h3>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
              <ArrowUpCircle className="w-4 h-4" /> +12.5%
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Tổng chi tiêu</p>
            <h3 className="text-2xl font-bold text-gray-900">{summary.totalExpense.toLocaleString('vi-VN')}đ</h3>
            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
              <ArrowDownCircle className="w-4 h-4" /> -8.3%
            </p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Số dư hiện tại</p>
            <h3 className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.balance.toLocaleString('vi-VN')}đ
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
               9.12.5%
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ tròn */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Chi tiêu theo danh mục</h3>
          <div className="flex items-center">
            <div className="h-64 flex-1">
              {pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu chi tiêu</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `${value.toLocaleString('vi-VN')}đ`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="w-48">
              <ul className="space-y-3">
                {pieData.map((item, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-gray-600 text-left block max-w-[100px] truncate capitalize">{item.name}</span>
                    </span>
                    <span className="font-medium">{item.value.toLocaleString('vi-VN')}đ</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Biểu đồ đường */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Thu nhập vs Chi tiêu</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => value >= 1000000 ? `${value/1000000}M` : value} />
                <RechartsTooltip formatter={(value) => `${value.toLocaleString('vi-VN')}đ`} />
                <Line type="monotone" dataKey="income" name="Thu nhập" stroke="#10b981" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="expense" name="Chi tiêu" stroke="#ef4444" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;