import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';

const Dashboard = () => {
  // Dữ liệu mẫu cho biểu đồ tròn (Chi tiêu theo danh mục)
  const pieData = [
    { name: 'Ăn uống', value: 4200000, color: '#3b82f6' },
    { name: 'Di chuyển', value: 2450000, color: '#8b5cf6' },
    { name: 'Mua sắm', value: 2300000, color: '#f59e0b' },
    { name: 'Hóa đơn', value: 2150000, color: '#10b981' },
    { name: 'Giải trí', value: 1800000, color: '#ec4899' },
    { name: 'Khác', value: 850000, color: '#6b7280' },
  ];

  // Dữ liệu mẫu cho biểu đồ đường (Thu nhập vs Chi tiêu)
  const lineData = [
    { date: '01/06', income: 0, expense: 500000 },
    { date: '08/06', income: 15000000, expense: 2000000 },
    { date: '15/06', income: 0, expense: 4000000 },
    { date: '22/06', income: 0, expense: 3500000 },
    { date: '30/06', income: 10000000, expense: 5750000 },
  ];

  return (
    <div className="space-y-6">
      {/* Cards Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Tổng thu nhập</p>
            <h3 className="text-2xl font-bold text-gray-900">25.000.000đ</h3>
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
            <h3 className="text-2xl font-bold text-gray-900">15.750.000đ</h3>
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
            <h3 className="text-2xl font-bold text-green-600">9.250.000đ</h3>
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
            </div>
            <div className="w-48">
              <ul className="space-y-3">
                {pieData.map((item, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-gray-600">{item.name}</span>
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
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `${value/1000000}M`} />
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
