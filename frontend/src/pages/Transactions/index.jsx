import React, { useState, useEffect } from 'react';
import { Search, Plus, Coffee, ShoppingBag, Receipt, Car, ArrowDownCircle, ArrowUpCircle, Gamepad2, MoreHorizontal } from 'lucide-react';
import AddTransactionModal from '../../components/AddTransactionModal';
import { getTransactions } from '../../services/transactionService';
import { useTheme } from '../../context/ThemeContext';

const getCategoryDetails = (categoryId, t) => {
  const map = {
    'food': { name: t('cat_food'), icon: Coffee, color: 'text-orange-500' },
    'transport': { name: t('cat_transport'), icon: Car, color: 'text-blue-500' },
    'shopping': { name: t('cat_shopping'), icon: ShoppingBag, color: 'text-purple-500' },
    'bills': { name: t('cat_bills'), icon: Receipt, color: 'text-red-500' },
    'entertainment': { name: t('cat_entertainment'), icon: Gamepad2, color: 'text-pink-500' },
    'other': { name: t('cat_other'), icon: MoreHorizontal, color: 'text-gray-500' },
    'salary': { name: t('cat_salary'), icon: ArrowUpCircle, color: 'text-green-500' },
  };
  return map[categoryId] || { name: categoryId, icon: MoreHorizontal, color: 'text-gray-500' };
};

const Transactions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTheme();

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions();
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(t('transactions_error_api'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleTransactionAdded = () => {
    fetchTransactions();
  };

  return (
    <>
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 min-h-[calc(100vh-8rem)] animate-in fade-in duration-500 overflow-hidden flex flex-col">
        {/* Header & Toolbar */}
        <div className="p-6 border-b border-gray-100/60 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <select className="border border-gray-200/80 bg-white/50 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all w-full sm:w-auto cursor-pointer shadow-sm">
              <option>Tháng 06/2025</option>
              <option>Tháng 05/2025</option>
            </select>
            <div className="flex bg-gray-100/80 p-1.5 rounded-xl shadow-inner w-full sm:w-auto">
              <button className="flex-1 sm:flex-none px-5 py-2 bg-white shadow-sm rounded-lg text-sm font-bold text-gray-800 transition-all">{t('transactions_all')}</button>
              <button className="flex-1 sm:flex-none px-5 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-all">{t('transactions_income')}</button>
              <button className="flex-1 sm:flex-none px-5 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-all">{t('transactions_expense')}</button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder={t('transactions_search')} 
                className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200/80 rounded-xl text-sm w-full md:w-64 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all shadow-sm font-medium"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300 hover:-translate-y-0.5 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" /> {t('transactions_add_btn')}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 font-medium">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
              {t('transactions_loading')}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-rose-500 font-medium">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Receipt className="w-12 h-12 mb-3 text-gray-300" />
              <span className="font-medium">{t('transactions_no_data')}</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100/60 bg-gray-50/30 text-gray-500 text-xs uppercase tracking-widest">
                  <th className="font-bold p-5 pl-8">{t('transactions_col_date')}</th>
                  <th className="font-bold p-5">{t('transactions_col_category')}</th>
                  <th className="font-bold p-5">{t('transactions_col_note')}</th>
                  <th className="font-bold p-5 text-right">{t('transactions_col_amount')}</th>
                  <th className="font-bold p-5 text-center">{t('transactions_col_type')}</th>
                  <th className="font-bold p-5">{t('transactions_col_wallet')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {transactions.map((tx) => {
                  const catDetails = getCategoryDetails(tx.category, t);
                  const IconComponent = catDetails.icon;
                  const dateObj = new Date(tx.date);
                  const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
                  
                  return (
                    <tr key={tx._id} className="hover:bg-emerald-50/30 transition-colors group cursor-pointer">
                      <td className="p-5 pl-8 text-sm font-semibold text-gray-600 group-hover:text-emerald-700 transition-colors">{dateStr}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className={`w-5 h-5 ${catDetails.color}`} />
                          </div>
                          <span className="text-sm font-bold text-gray-800 group-hover:text-gray-900">{catDetails.name}</span>
                        </div>
                      </td>
                      <td className="p-5 text-sm text-gray-500 font-medium">{tx.note || '-'}</td>
                      <td className={`p-5 text-right font-extrabold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                          {tx.type === 'income' ? t('transactions_income') : t('transactions_expense')}
                        </span>
                      </td>
                      <td className="p-5 text-sm font-semibold text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          {tx.wallet?.name || '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleTransactionAdded} 
      />
    </>
  );
};

export default Transactions;
