import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Coffee, Car, ShoppingBag, Receipt, Gamepad2, MoreHorizontal, ArrowUpCircle } from 'lucide-react';
import { getWallets } from '../services/walletService';
import { createTransaction } from '../services/transactionService';
import { useTheme } from '../context/ThemeContext';

const AddTransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const [type, setType] = useState('expense'); // 'expense' or 'income'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [walletId, setWalletId] = useState('');
  const [note, setNote] = useState('');
  
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTheme();

  const expenseCategories = [
    { id: 'food', name: t('cat_food'), icon: Coffee, color: 'text-orange-500', bg: 'bg-orange-100' },
    { id: 'transport', name: t('cat_transport'), icon: Car, color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'shopping', name: t('cat_shopping'), icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'bills', name: t('cat_bills'), icon: Receipt, color: 'text-red-500', bg: 'bg-red-100' },
    { id: 'entertainment', name: t('cat_entertainment'), icon: Gamepad2, color: 'text-pink-500', bg: 'bg-pink-100' },
    { id: 'other', name: t('cat_other'), icon: MoreHorizontal, color: 'text-gray-500', bg: 'bg-gray-100' },
  ];

  const incomeCategories = [
    { id: 'salary', name: t('cat_salary'), icon: ArrowUpCircle, color: 'text-green-500', bg: 'bg-green-100' },
    { id: 'other', name: t('cat_other'), icon: MoreHorizontal, color: 'text-gray-500', bg: 'bg-gray-100' },
  ];

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setType('expense');
      setAmount('');
      setCategory('food');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setError('');
      
      // Fetch wallets
      const fetchWallets = async () => {
        try {
          const data = await getWallets();
          setWallets(data);
          if (data.length > 0) {
            setWalletId(data[0]._id);
          }
        } catch (err) {
          console.error(t('transactions_modal_err_fetch_wallets'), err);
        }
      };
      fetchWallets();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!amount || !walletId) {
      setError(t('transactions_modal_err_validation'));
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await createTransaction({
        amount: Number(amount),
        type,
        category,
        date,
        note,
        walletId
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('transactions_modal_err_add'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10">
          <X className="w-5 h-5" />
        </button>
        
        {/* Header Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-4 text-center font-semibold text-lg transition-colors ${
              type === 'expense' 
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => { setType('expense'); setCategory('food'); }}
          >
            {t('transactions_expense')}
          </button>
          <button
            className={`flex-1 py-4 text-center font-semibold text-lg transition-colors ${
              type === 'income' 
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => { setType('income'); setCategory('salary'); }}
          >
            {t('transactions_income')}
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5">
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactions_modal_amount')}</label>
            <div className="relative">
              <input
                type="number"
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
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('transactions_modal_category')}</label>
            <div className="grid grid-cols-4 gap-4">
              {currentCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 group transition-all ${category === cat.id ? 'opacity-100 scale-110' : 'opacity-60 hover:opacity-100'}`}
                >
                  <div className={`w-12 h-12 rounded-full ${cat.bg} flex items-center justify-center border-2 ${category === cat.id ? 'border-gray-400' : 'border-transparent group-hover:border-gray-300'}`}>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactions_modal_date')}</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactions_modal_wallet')}</label>
              <select 
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none"
              >
                {wallets.length === 0 ? <option value="">{t('transactions_modal_wallet_loading')}</option> : 
                  wallets.map(w => <option key={w._id} value={w._id}>{w.name}</option>)
                }
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactions_modal_note')}</label>
            <input 
              type="text" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('transactions_modal_note_placeholder')} 
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none" 
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t">
          <button 
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-white border rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('transactions_modal_cancel')}
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 rounded-lg font-medium text-white hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? t('transactions_modal_save_loading') : t('transactions_modal_save')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddTransactionModal;
