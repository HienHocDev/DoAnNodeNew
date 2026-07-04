import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col h-screen">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Xin chào, Hiển! 👋</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Tháng 06/2025</span>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border-2 border-green-200">
              H
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-gray-100/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
