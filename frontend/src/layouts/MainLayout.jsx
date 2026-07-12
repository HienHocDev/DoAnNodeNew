import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut } from 'lucide-react';

const MainLayout = () => {
  const { user, logoutContext } = useAuth();
  const { t } = useTheme();

  const currentDate = new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const year = currentDate.getFullYear();
  const displayDate = `${month}/${year}`;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col h-screen">
        <header className="h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-8 flex items-center justify-between shrink-0 transition-colors duration-200">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('header_hello')}, {user.name}! 👋</h2>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-500">{t('header_month')} {displayDate}</span>
            <div className="flex items-center gap-3 border-l pl-6">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border-2 border-green-200 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <button 
                onClick={logoutContext}
                className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors text-sm font-medium"
                title={t('header_logout')}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('header_logout')}</span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-gray-100/50 dark:bg-gray-800/50 transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
