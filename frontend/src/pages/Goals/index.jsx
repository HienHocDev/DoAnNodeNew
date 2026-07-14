import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Target, Trash2, Calendar, DollarSign, Edit2 } from 'lucide-react';
import { getGoals, createGoal, updateGoalAmount, deleteGoal } from '../../services/goalService';
import { useTheme } from '../../context/ThemeContext';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTheme();

  // Form states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const fetchGoalsData = async () => {
    try {
      setLoading(true);
      const data = await getGoals();
      setGoals(data);
      setError('');
    } catch (err) {
      setError(t('goals_error_api'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsData();
  }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadline) return alert(t('goals_error_fill'));

    try {
      await createGoal({
        name,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
        deadline
      });
      setIsModalOpen(false);
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadline('');
      fetchGoalsData();
    } catch (err) {
      alert(t('goals_error_add'));
    }
  };

  const handleUpdateAmount = async (id, oldAmount) => {
    const newAmount = prompt(t('goals_prompt_amount'), oldAmount);
    if (newAmount === null || newAmount === '') return;
    if (isNaN(newAmount)) return alert(t('goals_error_invalid_number'));

    try {
      await updateGoalAmount(id, Number(newAmount));
      fetchGoalsData();
    } catch (err) {
      alert(t('goals_error_update'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('goals_confirm_delete'))) {
      try {
        await deleteGoal(id);
        fetchGoalsData();
      } catch (err) {
        alert(t('goals_error_delete'));
      }
    }
  };

  return (
    <>
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 min-h-[calc(100vh-8rem)] p-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">{t('goals_title')}</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">{t('goals_subtitle')}</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300 hover:-translate-y-0.5 w-full md:w-auto"
          >
            <Plus className="w-5 h-5" /> {t('goals_add_btn')}
          </button>
        </div>

        {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 font-medium">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
            {t('goals_loading')}
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Target className="w-12 h-12 mb-3 text-gray-300" />
            <span className="font-medium">{t('goals_no_data')}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {goals.map((goal) => {
              let percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              if (percent > 100) percent = 100;

              return (
                <div key={goal._id} className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-100/80 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100/80 shadow-inner flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-800 text-lg tracking-tight group-hover:text-emerald-700 transition-colors">{goal.name}</h3>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3.5 h-3.5" /> {t('goals_deadline_prefix')} {new Date(goal.deadline).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleUpdateAmount(goal._id, goal.currentAmount)}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded-xl transition-colors shadow-sm"
                        title="Cập nhật số tiền"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(goal._id)}
                        className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors shadow-sm"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-500 uppercase tracking-wider text-xs">{t('goals_accumulated')}</span>
                      <span className="font-bold text-gray-800">{goal.currentAmount.toLocaleString('vi-VN')}đ / <span className="text-gray-500">{goal.targetAmount.toLocaleString('vi-VN')}đ</span></span>
                    </div>
                    
                    <div className="w-full h-2.5 bg-gray-100/80 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className={`text-xs font-bold ${percent >= 100 ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500'} px-2 py-1 rounded-md`}>
                        {percent >= 100 ? 'Hoàn thành!' : 'Đang thực hiện'}
                      </span>
                      <span className="text-sm font-extrabold text-emerald-600">
                        {Math.round(percent)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL THÊM MỤC TIÊU */}
        {isModalOpen && createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-7 transform transition-all scale-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">{t('goals_modal_title')}</h3>
              <form onSubmit={handleAddGoal} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('goals_name_label')}</label>
                  <input 
                    type="text" 
                    placeholder={t('goals_name_placeholder')} 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200/80 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('goals_target_label')}</label>
                  <input 
                    type="number" 
                    placeholder={t('goals_target_placeholder')} 
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full border border-gray-200/80 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('goals_current_label')}</label>
                  <input 
                    type="number" 
                    placeholder={t('goals_current_placeholder')} 
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full border border-gray-200/80 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('goals_deadline_label')}</label>
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full border border-gray-200/80 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-gray-50/50 cursor-pointer"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 text-sm font-bold">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-200/80 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {t('goals_cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300 hover:-translate-y-0.5"
                  >
                    {t('goals_create')}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
};

export default Goals;