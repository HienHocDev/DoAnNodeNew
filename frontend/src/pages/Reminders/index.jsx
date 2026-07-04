import React from 'react';
import { Bell, Droplets, Wifi, Zap } from 'lucide-react';

const Reminders = () => {
  const reminders = [
    { id: 1, title: 'Hóa đơn điện', date: '05/07/2025', daysLeft: 2, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-100', badgeColor: 'bg-yellow-100 text-yellow-700' },
    { id: 2, title: 'Hóa đơn nước', date: '07/07/2025', daysLeft: 4, icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-100', badgeColor: 'bg-green-100 text-green-700' },
    { id: 3, title: 'Tiền internet', date: '10/07/2025', daysLeft: 7, icon: Wifi, color: 'text-purple-500', bg: 'bg-purple-100', badgeColor: 'bg-green-100 text-green-700' },
    { id: 4, title: 'Bảo hiểm xe máy', date: '15/07/2025', daysLeft: 12, icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100', badgeColor: 'bg-green-100 text-green-700' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl min-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Nhắc nhở hóa đơn</h2>
          <p className="text-sm text-gray-500 mt-1">Đừng bỏ lỡ các khoản thanh toán định kỳ</p>
        </div>
      </div>

      <div className="space-y-4">
        {reminders.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.bg}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1">Đến hạn: {item.date}</p>
              </div>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.badgeColor}`}>
              Còn {item.daysLeft} ngày
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reminders;
