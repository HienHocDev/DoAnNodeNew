import React, { useState } from 'react';
import { X, Coffee, Car, ShoppingBag, Receipt, Gamepad2, MoreHorizontal } from 'lucide-react';

const AddTransactionModal = ({ isOpen, onClose }) => {
  const [type, setType] = useState('expense'); // 'expense' or 'income'
  const [amount, setAmount] = useState('');
  
  if (!isOpen) return null;

  const categories = [
    { id: 'food', name: 'Ăn uống', icon: Coffee, color: 'text-orange-500', bg: 'bg-orange-100' },
    { id: 'transport', name: 'Di chuyển', icon: Car, color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'shopping', name: 'Mua sắm', icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'bills', name: 'Hóa đơn', icon: Receipt, color: 'text-red-500', bg: 'bg-red-100' },
    { id: 'entertainment', name: 'Giải trí', icon: Gamepad2, color: 'text-pink-500', bg: 'bg-pink-100' },
    { id: 'other', name: 'Khác', icon: MoreHorizontal, color: 'text-gray-500', bg: 'bg-gray-100' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-4 text-center font-semibold text-lg transition-colors ${
              type === 'expense' 
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => setType('expense')}
          >
            Chi tiêu
          </button>
          <button
            className={`flex-1 py-4 text-center font-semibold text-lg transition-colors ${
              type === 'income' 
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => setType('income')}
          >
            Thu nhập
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
            <div className="relative">
              <input
                type="text"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-right text-3xl font-bold border-b-2 border-gray-200 focus:border-green-500 outline-none py-2 pr-8"
              />
              <span className="absolute right-0 bottom-3 text-gray-500 font-semibold">đ</span>
            </div>
          </div>

          {/* Categories Grid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Danh mục</label>
            <div className="grid grid-cols-4 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={`w-12 h-12 rounded-full ${cat.bg} flex items-center justify-center border-2 border-transparent hover:border-gray-300 transition-all`}>
                    <cat.icon className={`w-6 h-6 ${cat.color}`} />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Wallet */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none" defaultValue="2025-07-01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ví</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none">
                <option>Ví chính</option>
                <option>Tiền mặt</option>
                <option>Thẻ tín dụng</option>
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung / Ghi chú</label>
            <input type="text" placeholder="Ăn trưa cùng bạn..." className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none" />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button 
            className="flex-1 px-4 py-2 bg-green-600 rounded-lg font-medium text-white hover:bg-green-700 transition-colors shadow-sm"
          >
            Lưu giao dịch
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
