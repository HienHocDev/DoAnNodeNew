import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Coffee, Car, ShoppingBag, Gamepad2, Receipt, HelpCircle, Trash2, Wallet } from 'lucide-react';
import { getBudgets, createBudget, deleteBudget } from '../../services/budgetService';
import { useTheme } from '../../context/ThemeContext';

const iconMap = {
  'Ăn uống': { icon: Coffee, color: 'text-orange-500' },
  'Di chuyển': { icon: Car, color: 'text-blue-500' },
  'Mua sắm': { icon: ShoppingBag, color: 'text-purple-500' },
  'Giải trí': { icon: Gamepad2, color: 'text-pink-500' },
  'Hóa đơn': { icon: Receipt, color: 'text-red-500' },
};

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState(''); // Thay limit thành amount cho khớp Backend
  const { t } = useTheme();

  const fetchBudgetsData = async () => {
    try {
      setLoading(true);
      const data = await getBudgets();
      setBudgets(data);
      setBudgets(data);
      setError('');
    } catch (err) {
      setError(t('budgets_error_api'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetsData();
  }, []);

  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!category || !amount) return alert(t('budgets_error_fill'));

    try {
      // Gửi trường amount lên Backend
      await createBudget({ category, amount: Number(amount) }); 
      setIsModalOpen(false);
      setCategory('');
      setAmount('');
      fetchBudgetsData(); 
    } catch (err) {
      alert(err.response?.data?.msg || t('budgets_error_add'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('budgets_confirm_delete'))) {
      try {
        await deleteBudget(id);
        fetchBudgetsData();
      } catch (err) {
        alert(t('budgets_error_delete'));
      }
    }
  };

  const getProgressColor = (percent) => {
    if (percent < 70) return 'bg-green-500';
    if (percent < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 min-h-[calc(100vh-8rem)] p-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">{t('budgets_title')}</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">{t('budgets_subtitle')}</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300 hover:-translate-y-0.5 w-full md:w-auto"
          >
            <Plus className="w-5 h-5" /> {t('budgets_add_btn')}
          </button>
        </div>

        {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 font-medium">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
            {t('budgets_loading')}
          </div>
        ) : budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Wallet className="w-12 h-12 mb-3 text-gray-300" />
            <span className="font-medium">{t('budgets_no_data')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100/60 bg-gray-50/30 text-gray-500 text-xs uppercase tracking-widest">
                  <th className="font-bold p-5 pl-4 rounded-tl-xl">{t('budgets_table_category')}</th>
                  <th className="font-bold p-5 text-right">{t('budgets_table_budget')}</th>
                  <th className="font-bold p-5 text-right">{t('budgets_table_spent')}</th>
                  <th className="font-bold p-5 text-right">{t('budgets_table_remaining')}</th>
                  <th className="font-bold p-5 w-48 text-center">{t('budgets_table_ratio')}</th>
                  <th className="font-bold p-5 text-center rounded-tr-xl">{t('budgets_table_action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {budgets.map((item) => {
                  const totalExpense = item.totalExpense || 0;
                  const remaining = item.amount - totalExpense; // Dùng item.amount
                  let percent = item.amount > 0 ? (totalExpense / item.amount) * 100 : 0;
                  if (percent > 100) percent = 100;

                  const iconConfig = iconMap[item.category] || { icon: HelpCircle, color: 'text-gray-500' };
                  const IconComponent = iconConfig.icon;

                  return (
                    <tr key={item._id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="p-5 pl-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className={`w-5 h-5 ${iconConfig.color}`} />
                          </div>
                          <span className="text-sm font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">{item.category}</span>
                        </div>
                      </td>
                      <td className="p-5 text-right text-sm font-bold text-gray-700">{item.amount.toLocaleString('vi-VN')}đ</td>
                      <td className="p-5 text-right text-sm font-bold text-rose-500">{totalExpense.toLocaleString('vi-VN')}đ</td>
                      <td className="p-5 text-right text-sm font-extrabold text-emerald-600">{remaining.toLocaleString('vi-VN')}đ</td>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2.5 bg-gray-100/80 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(percent)}`} 
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-600 w-9 text-right">{Math.round(percent)}%</span>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <button 
                          onClick={() => handleDelete(item._id)}
                          className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL THÊM */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-7 transform transition-all scale-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">{t('budgets_modal_title')}</h3>
            <form onSubmit={handleAddBudget} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('budgets_cat_label')}</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200/80 rounded-xl p-3 text-sm font-medium bg-gray-50/50 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                  <option value="">{t('budgets_cat_placeholder')}</option>
                  <option value="Ăn uống">{t('budgets_cat_food')}</option>
                  <option value="Di chuyển">{t('budgets_cat_transport')}</option>
                  <option value="Mua sắm">{t('budgets_cat_shopping')}</option>
                  <option value="Giải trí">{t('budgets_cat_entertainment')}</option>
                  <option value="Hóa đơn">{t('budgets_cat_bills')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('budgets_limit_label')}</label>
                <input 
                  type="number" 
                  placeholder={t('budgets_limit_placeholder')} 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-200/80 rounded-xl p-3 text-sm font-medium bg-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 text-sm font-bold">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200/80 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {t('budgets_cancel')}
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300 hover:-translate-y-0.5"
                >
                  {t('budgets_save')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Budgets;