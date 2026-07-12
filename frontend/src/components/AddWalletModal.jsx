import React, { useState, useEffect } from 'react';
import { X, Wallet, CreditCard, Banknote } from 'lucide-react';
import { createWallet } from '../services/walletService';

const AddWalletModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [icon, setIcon] = useState('Wallet');
  const [isDefault, setIsDefault] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const icons = [
    { id: 'Wallet', icon: Wallet, label: 'Ví', bg: 'bg-blue-100', color: 'text-blue-600' },
    { id: 'Banknote', icon: Banknote, label: 'Tiền mặt', bg: 'bg-green-100', color: 'text-green-600' },
    { id: 'CreditCard', icon: CreditCard, label: 'Thẻ', bg: 'bg-purple-100', color: 'text-purple-600' },
  ];

  useEffect(() => {
    if (isOpen) {
      setName('');
      setBalance('');
      setIcon('Wallet');
      setIsDefault(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name) {
      setError('Vui lòng nhập tên ví');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await createWallet({
        name,
        balance: Number(balance) || 0,
        icon,
        isDefault
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi thêm ví');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10">
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Thêm ví mới</h2>
        </div>

        <div className="p-6 space-y-5">
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên ví / Tài khoản</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Tiền mặt, Thẻ tín dụng..." 
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số dư ban đầu</label>
            <div className="relative">
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none pr-8 text-right"
              />
              <span className="absolute right-3 top-2 text-gray-500 font-medium">đ</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Biểu tượng</label>
            <div className="flex gap-4">
              {icons.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setIcon(item.id)}
                  className={`flex flex-col items-center gap-1 group transition-all ${icon === item.id ? 'opacity-100 scale-110' : 'opacity-60 hover:opacity-100'}`}
                >
                  <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center border-2 ${icon === item.id ? 'border-gray-400' : 'border-transparent group-hover:border-gray-300'}`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="isDefault" 
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
            <label htmlFor="isDefault" className="text-sm text-gray-700 cursor-pointer">
              Đặt làm ví mặc định
            </label>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t">
          <button 
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-white border rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 rounded-lg font-medium text-white hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Đang thêm...' : 'Thêm ví'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWalletModal;
