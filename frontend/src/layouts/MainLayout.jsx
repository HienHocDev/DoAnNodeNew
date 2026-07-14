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
    <div className="flex h-screen bg-[#f4f7fe] dark:bg-gray-950 overflow-hidden font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col h-screen relative">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-64 bg-primary-500/5 dark:bg-primary-500/10 -z-10 rounded-b-[4rem]"></div>
        
        <header className="h-20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 px-8 flex items-center justify-between shrink-0 sticky top-0 z-10 transition-all duration-300">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
              {t('header_hello')}, <span className="text-primary-600 dark:text-primary-400">{user.name}</span>! 👋
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
              Welcome back to your dashboard
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{displayDate}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('header_month')}</span>
            </div>
            
            <div className="flex items-center gap-4 border-l border-gray-200 dark:border-gray-700 pl-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary-500 to-primary-300 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/30 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              
              <button 
                onClick={logoutContext}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-sm font-semibold group"
                title={t('header_logout')}
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">{t('header_logout')}</span>
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
