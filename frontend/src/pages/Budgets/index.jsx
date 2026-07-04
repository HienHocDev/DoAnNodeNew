import React from 'react';
import { Plus, Coffee, Car, ShoppingBag, Gamepad2, Receipt } from 'lucide-react';

const Budgets = () => {
  const budgets = [
    { id: 1, category: 'Ăn uống', icon: Coffee, iconColor: 'text-orange-500', budget: 4000000, spent: 3200000, remaining: 800000, percent: 80 },
    { id: 2, category: 'Di chuyển', icon: Car, iconColor: 'text-blue-500', budget: 2000000, spent: 1250000, remaining: 750000, percent: 62 },
    { id: 3, category: 'Mua sắm', icon: ShoppingBag, iconColor: 'text-purple-500', budget: 3000000, spent: 2700000, remaining: 300000, percent: 90 },
    { id: 4, category: 'Giải trí', icon: Gamepad2, iconColor: 'text-pink-500', budget: 1500000, spent: 800000, remaining: 700000, percent: 53 },
    { id: 5, category: 'Hóa đơn', icon: Receipt, iconColor: 'text-red-500', budget: 2000000, spent: 1800000, remaining: 200000, percent: 90 },
  ];

  const getProgressColor = (percent) => {
    if (percent < 70) return 'bg-green-500';
    if (percent < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[calc(100vh-8rem)] p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý Ngân sách</h2>
          <p className="text-sm text-gray-500 mt-1">Theo dõi giới hạn chi tiêu trong tháng</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Thêm ngân sách
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-gray-500 text-sm">
              <th className="font-medium p-4 pl-0">Danh mục</th>
              <th className="font-medium p-4 text-right">Ngân sách</th>
              <th className="font-medium p-4 text-right">Đã chi</th>
              <th className="font-medium p-4 text-right">Còn lại</th>
              <th className="font-medium p-4 w-48 text-center">Tỷ lệ</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50/50 transition-colors">
                <td className="p-4 pl-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-800">{item.category}</span>
                  </div>
                </td>
                <td className="p-4 text-right text-sm font-medium text-gray-700">{item.budget.toLocaleString('vi-VN')}đ</td>
                <td className="p-4 text-right text-sm font-medium text-gray-700">{item.spent.toLocaleString('vi-VN')}đ</td>
                <td className="p-4 text-right text-sm font-medium text-gray-700">{item.remaining.toLocaleString('vi-VN')}đ</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getProgressColor(item.percent)}`} 
                        style={{ width: `${item.percent}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-8">{item.percent}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Budgets;
