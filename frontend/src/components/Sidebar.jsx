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
    <div className="w-64 h-screen bg-white/90 backdrop-blur-2xl dark:bg-gray-900 shadow-soft flex flex-col fixed left-0 top-0 transition-all duration-300 border-r border-gray-100 dark:border-gray-800/60 z-50">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800/60 flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30 flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
          Finance <span className="text-primary-600 dark:text-primary-400">Tracker</span>
        </h1>
        <p className="text-[10px] text-gray-400 font-bold dark:text-gray-500 mt-1 uppercase tracking-widest">{t('sidebar_subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <nav className="space-y-1.5 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      

    </div>
  );
};

export default Sidebar;
