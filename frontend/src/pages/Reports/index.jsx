import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { FileText, Download } from 'lucide-react';

const Reports = () => {
  const [filterType, setFilterType] = useState('expense'); // expense, income, all

  const data = [
    { name: 'Ăn uống', value: 4200000, percent: 26.7, color: '#3b82f6' },
    { name: 'Di chuyển', value: 2450000, percent: 15.6, color: '#8b5cf6' },
    { name: 'Mua sắm', value: 2300000, percent: 14.6, color: '#f59e0b' },
    { name: 'Hóa đơn', value: 2150000, percent: 13.7, color: '#10b981' },
    { name: 'Giải trí', value: 1800000, percent: 11.4, color: '#ec4899' },
    { name: 'Khác', value: 850000, percent: 5.4, color: '#6b7280' },
  ];

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[calc(100vh-8rem)]">
      <div className="p-6 border-b flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo chi tiết</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setFilterType('expense')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium ${filterType === 'expense' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Chi tiêu
            </button>
            <button 
              onClick={() => setFilterType('income')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium ${filterType === 'income' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Thu nhập
            </button>
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium ${filterType === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Tổng quan
            </button>
          </div>

          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-green-500">
            <option>Tháng 06/2025</option>
            <option>Tháng 05/2025</option>
          </select>
        </div>
      </div>

      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-gray-500 font-medium">Tổng chi tiêu</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{total.toLocaleString('vi-VN')}đ</h3>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <FileText className="w-4 h-4" /> Xuất PDF
            </button>
            <button className="flex items-center gap-2 bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12 mt-8">
          <div className="w-72 h-72 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => `${value.toLocaleString('vi-VN')}đ`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-gray-500 text-sm font-medium">Chi tiêu</span>
              <span className="text-xl font-bold text-gray-900">100%</span>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md">
            <ul className="space-y-4">
              {data.map((item, index) => (
                <li key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-700 font-medium text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-gray-900 font-semibold text-sm w-24 text-right">{item.value.toLocaleString('vi-VN')}đ</span>
                    <span className="text-gray-500 font-medium text-sm w-12 text-right">{item.percent}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
