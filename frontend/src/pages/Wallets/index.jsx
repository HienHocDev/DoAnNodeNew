import React, { useState, useEffect } from 'react';
import { Plus, Wallet, CreditCard, Banknote, MoreVertical, Trash2 } from 'lucide-react';
import { getWallets, deleteWallet } from '../../services/walletService';
import AddWalletModal from '../../components/AddWalletModal';
import { useTheme } from '../../context/ThemeContext';

const iconMap = {
  'Wallet': { icon: Wallet, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  'Banknote': { icon: Banknote, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  'CreditCard': { icon: CreditCard, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' }
};

const Wallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTheme();

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const data = await getWallets();
      setWallets(data);
    } catch (error) {
      console.error(t('wallets_error_fetch'), error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm(t('wallets_confirm_delete'))) {
      try {
        await deleteWallet(id);
        fetchWallets();
      } catch (err) {
        alert(err.response?.data?.message || t('wallets_error_delete'));
      }
    }
  };

  return (
    <>
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-8 min-h-[calc(100vh-8rem)] max-w-5xl mx-auto animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">{t('wallets_title')}</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">{t('wallets_subtitle')}</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300 hover:-translate-y-0.5 w-full md:w-auto"
          >
            <Plus className="w-5 h-5" /> {t('wallets_add_btn')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center h-64 text-gray-400 font-medium">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
              {t('wallets_loading')}
            </div>
          ) : wallets.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200/60 rounded-3xl bg-gray-50/50">
              <Wallet className="w-12 h-12 mb-3 text-gray-300" />
              <span className="font-medium">{t('wallets_no_data')}</span>
            </div>
          ) : (
            wallets.map((wallet, index) => {
              const iconData = iconMap[wallet.icon] || iconMap['Wallet'];
              const IconComponent = iconData.icon;
              
              // Generate some beautiful gradients for the cards
              const gradients = [
                'from-emerald-500 to-teal-600',
                'from-blue-500 to-indigo-600',
                'from-purple-500 to-fuchsia-600',
                'from-rose-500 to-red-600',
                'from-orange-500 to-amber-600'
              ];
              const bgGradient = wallet.isDefault ? 'from-gray-900 to-gray-800' : gradients[index % gradients.length];

              return (
                <div key={wallet._id} className={`relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1 bg-gradient-to-br ${bgGradient} text-white`}>
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/4"></div>
                  
                  <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-md shadow-inner`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg tracking-wide">{wallet.name}</h3>
                        </div>
                      </div>
                      {wallet.isDefault && (
                        <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-sm text-white border border-white/20 shadow-sm">
                          {t('wallets_default_badge')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-end justify-between mt-4">
                      <div>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">Số dư</p>
                        <span className={`text-2xl font-black tracking-tight ${wallet.balance < 0 ? 'text-rose-300' : 'text-white'}`}>
                          {wallet.balance.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      
                      <button 
                        onClick={(e) => handleDelete(wallet._id, e)}
                        className="p-2 text-white/50 hover:text-rose-300 hover:bg-white/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                        title={t('wallets_delete_tooltip')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <AddWalletModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchWallets} 
      />
    </>
  );
};

export default Wallets;
