import React from 'react';
import { Plus, Plane, Laptop, ShieldAlert, Calendar } from 'lucide-react';

const Goals = () => {
  const goals = [
    { 
      id: 1, 
      name: 'Du lịch Đà Nẵng', 
      icon: Plane, 
      iconBg: 'bg-purple-100', 
      iconColor: 'text-purple-600', 
      currentAmount: 15000000, 
      targetAmount: 20000000, 
      percent: 75, 
      daysLeft: 45 
    },
    { 
      id: 2, 
      name: 'Mua MacBook Pro', 
      icon: Laptop, 
      iconBg: 'bg-blue-100', 
      iconColor: 'text-blue-600', 
      currentAmount: 22000000, 
      targetAmount: 35000000, 
      percent: 63, 
      daysLeft: 120 
    },
    { 
      id: 3, 
      name: 'Quỹ khẩn cấp', 
      icon: ShieldAlert, 
      iconBg: 'bg-green-100', 
      iconColor: 'text-green-600', 
      currentAmount: 10000000, 
      targetAmount: 15000000, 
      percent: 67, 
      daysLeft: 90 
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Mục tiêu tài chính</h2>
          <p className="text-sm text-gray-500 mt-1">Lên kế hoạch và theo dõi các khoản tiết kiệm</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Tạo mục tiêu
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${goal.iconBg}`}>
                  <goal.icon className={`w-6 h-6 ${goal.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{goal.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" /> Còn {goal.daysLeft} ngày
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <div className="flex items-end justify-between">
                <p className="text-xs font-medium text-gray-500">
                  <span className="text-sm text-gray-900 font-bold">{goal.currentAmount.toLocaleString('vi-VN')}đ</span> / {goal.targetAmount.toLocaleString('vi-VN')}đ
                </p>
                <span className="text-sm font-bold text-green-600">{goal.percent}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${goal.percent}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Goals;
