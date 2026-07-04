import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  PieChart, 
  Wallet, 
  Target, 
  FileText, 
  Bell, 
  BarChart2, 
  Settings 
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Tổng quan', path: '/', icon: LayoutDashboard },
    { name: 'Giao dịch', path: '/transactions', icon: ArrowRightLeft },
    { name: 'Ngân sách', path: '/budgets', icon: Wallet },
    { name: 'Mục tiêu', path: '/goals', icon: Target },
    { name: 'Ví & Tài khoản', path: '/wallets', icon: Wallet },
    { name: 'Báo cáo', path: '/reports', icon: FileText },
    { name: 'Nhắc nhở', path: '/reminders', icon: Bell },
    { name: 'Phân tích', path: '/analysis', icon: BarChart2 },
    { name: 'Cài đặt', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-white shadow-lg flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-green-600 flex items-center gap-2">
          <Wallet className="w-8 h-8" />
          Finance Tracker
        </h1>
        <p className="text-xs text-gray-500 mt-1">Website theo dõi chi tiêu cá nhân</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
