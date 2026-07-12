import React, { useState, useEffect } from 'react';
import { Plus, Wallet, CreditCard, Banknote, MoreVertical, Trash2 } from 'lucide-react';
import { getWallets, deleteWallet } from '../../services/walletService';
import AddWalletModal from '../../components/AddWalletModal';

const iconMap = {
  'Wallet': { icon: Wallet, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  'Banknote': { icon: Banknote, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  'CreditCard': { icon: CreditCard, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' }
};

const Wallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const data = await getWallets();
      setWallets(data);
    } catch (error) {
      console.error('Lỗi lấy ví', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa ví này không? Việc này có thể ảnh hưởng đến lịch sử giao dịch.')) {
      try {
        await deleteWallet(id);
        fetchWallets();
      } catch (err) {
        alert(err.response?.data?.message || 'Có lỗi khi xóa');
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[calc(100vh-8rem)] max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Ví & Tài khoản</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý số dư trên các phương thức thanh toán</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm ví
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Đang tải dữ liệu...</div>
        ) : wallets.length === 0 ? (
          <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-xl">Chưa có ví nào. Hãy thêm ví mới!</div>
        ) : (
          wallets.map((wallet) => {
            const iconData = iconMap[wallet.icon] || iconMap['Wallet'];
            const IconComponent = iconData.icon;

            return (
              <div key={wallet._id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconData.iconBg}`}>
                    <IconComponent className={`w-6 h-6 ${iconData.iconColor}`} />
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
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button 
                      onClick={(e) => handleDelete(wallet._id, e)}
                      className="p-1 text-gray-400 hover:text-red-600 bg-white shadow-sm border rounded-md"
                      title="Xóa ví"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddWalletModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchWallets} 
      />
    </div>
  );
};

export default Wallets;
