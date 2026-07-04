import React from 'react';
import { Plus, Wallet, CreditCard, Banknote, MoreVertical } from 'lucide-react';

const Wallets = () => {
  const wallets = [
    { id: 1, name: 'Ví chính', icon: Wallet, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', balance: 9250000, isDefault: true },
    { id: 2, name: 'Ví tiền mặt', icon: Banknote, iconBg: 'bg-green-100', iconColor: 'text-green-600', balance: 1500000, isDefault: false },
    { id: 3, name: 'Thẻ ATM Vietcombank', icon: CreditCard, iconBg: 'bg-teal-100', iconColor: 'text-teal-600', balance: 12300000, isDefault: false },
    { id: 4, name: 'Thẻ tín dụng MBBank', icon: CreditCard, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', balance: -3200000, isDefault: false },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[calc(100vh-8rem)] max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Ví & Tài khoản</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý số dư trên các phương thức thanh toán</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Thêm ví
        </button>
      </div>

      <div className="space-y-4">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${wallet.iconBg}`}>
                <wallet.icon className={`w-6 h-6 ${wallet.iconColor}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  {wallet.name}
                  {wallet.isDefault && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Mặc định
                    </span>
                  )}
                </h3>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <span className={`text-lg font-bold ${wallet.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {wallet.balance.toLocaleString('vi-VN')}đ
              </span>
              <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wallets;
