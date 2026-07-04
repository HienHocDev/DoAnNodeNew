import React from 'react';
import { User, Lock, Bell, Database, Globe, Moon } from 'lucide-react';

const Settings = () => {
  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar Cài đặt */}
      <div className="w-64 shrink-0 space-y-1">
        <h2 className="text-xl font-bold text-gray-800 mb-6 px-4">Cài đặt</h2>
        
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 text-green-700 font-medium transition-colors">
          <User className="w-5 h-5" /> Thông tin cá nhân
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors">
          <Lock className="w-5 h-5" /> Đổi mật khẩu
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors">
          <Bell className="w-5 h-5" /> Thông báo
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors">
          <Database className="w-5 h-5" /> Sao lưu dữ liệu
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors">
          <Globe className="w-5 h-5" /> Ngôn ngữ
        </button>
        
        <div className="pt-4 mt-4 border-t px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-gray-600 font-medium">
            <Moon className="w-5 h-5" /> Chế độ tối
          </div>
          <button className="w-11 h-6 bg-gray-200 rounded-full relative transition-colors cursor-pointer focus:outline-none">
            <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 transition-transform"></div>
          </button>
        </div>
      </div>

      {/* Nội dung chi tiết */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-4">Hồ sơ cá nhân</h3>
        
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-3xl border-4 border-white shadow-md">
            H
          </div>
          <div>
            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Thay đổi ảnh đại diện
            </button>
            <p className="text-xs text-gray-500 mt-2">Định dạng JPG, PNG. Tối đa 5MB.</p>
          </div>
        </div>

        <form className="max-w-md space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input 
              type="text" 
              defaultValue="Ngọc Hiển"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              defaultValue="hien@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input 
              type="tel" 
              placeholder="Nhập số điện thoại..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow" 
            />
          </div>

          <div className="pt-4">
            <button 
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
