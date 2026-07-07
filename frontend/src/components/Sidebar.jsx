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
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const { t } = useTheme();
  
  const navItems = [
    { name: t('sidebar_dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('sidebar_transactions'), path: '/transactions', icon: ArrowRightLeft },
    { name: t('sidebar_budgets'), path: '/budgets', icon: Wallet },
    { name: t('sidebar_goals'), path: '/goals', icon: Target },
    { name: t('sidebar_wallets'), path: '/wallets', icon: Wallet },
    { name: t('sidebar_reports'), path: '/reports', icon: FileText },
    { name: t('sidebar_reminders'), path: '/reminders', icon: Bell },
    { name: t('sidebar_analysis'), path: '/analysis', icon: BarChart2 },
    { name: t('sidebar_settings'), path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-white dark:bg-gray-900 shadow-lg flex flex-col fixed left-0 top-0 transition-colors duration-200 border-r dark:border-gray-800">
      <div className="p-6 border-b dark:border-gray-800">
        <h1 className="text-2xl font-bold text-green-600 flex items-center gap-2">
          <Wallet className="w-8 h-8" />
          Finance Tracker
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('sidebar_subtitle')}</p>
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
                    ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-green-600 dark:hover:text-green-400'
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
