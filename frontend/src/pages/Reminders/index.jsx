import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCircle, Plus } from 'lucide-react';
import AddReminderModal from '../../components/AddReminderModal';
import { getReminders, updateReminder, deleteReminder } from '../../services/reminderService';
import { useTheme } from '../../context/ThemeContext';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTheme();

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const data = await getReminders();
      setReminders(data);
    } catch (error) {
      console.error(t('reminders_error_fetch'), error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm(t('reminders_confirm_delete'))) {
      try {
        await deleteReminder(id);
        fetchReminders();
      } catch (err) {
        alert(t('reminders_error_delete'));
      }
    }
  };

  const handleToggleComplete = async (reminder) => {
    try {
      await updateReminder(reminder._id, { isCompleted: !reminder.isCompleted });
      fetchReminders();
    } catch (err) {
      alert(t('reminders_error_update'));
    }
  };

  // Helper to calculate days left
  const calculateDaysLeft = (dueDateStr) => {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    dueDate.setHours(0,0,0,0);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <>
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-8 max-w-4xl mx-auto min-h-[calc(100vh-8rem)] animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">{t('reminders_title')}</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">{t('reminders_subtitle')}</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300 hover:-translate-y-0.5 w-full md:w-auto"
          >
            <Plus className="w-5 h-5" /> {t('reminders_add_btn')}
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 font-medium">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
              {t('reminders_loading')}
            </div>
          ) : reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200/60 rounded-3xl bg-gray-50/50">
              <Bell className="w-12 h-12 mb-3 text-gray-300" />
              <span className="font-medium">{t('reminders_no_data')}</span>
            </div>
          ) : (
            reminders.map((item) => {
              const daysLeft = calculateDaysLeft(item.dueDate);
              const isOverdue = daysLeft < 0;
              const dateObj = new Date(item.dueDate);
              const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
              
              let badgeClass = 'bg-emerald-50 text-emerald-600 border-emerald-200/60 shadow-sm';
              let badgeText = `${t('reminders_days_left_prefix')}${daysLeft}${t('reminders_days_left_suffix')}`;

              if (item.isCompleted) {
                badgeClass = 'bg-gray-100/80 text-gray-500 border-gray-200/60';
                badgeText = t('reminders_done');
              } else if (isOverdue) {
                badgeClass = 'bg-rose-50 text-rose-600 border-rose-200/60 shadow-sm';
                badgeText = `${t('reminders_overdue_prefix')}${Math.abs(daysLeft)}${t('reminders_overdue_suffix')}`;
              } else if (daysLeft <= 3) {
                badgeClass = 'bg-amber-50 text-amber-600 border-amber-200/60 shadow-sm';
              }

              return (
                <div key={item._id} className={`flex items-center justify-between p-5 border border-gray-100/60 rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all group ${item.isCompleted ? 'opacity-60 bg-gray-50/50' : 'bg-white'}`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${item.isCompleted ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-br from-blue-50 to-indigo-50/80 text-indigo-500 group-hover:scale-110 transition-transform duration-300'}`}>
                      <Bell className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`font-extrabold text-lg tracking-tight ${item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{item.title}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1.5">
                        {t('reminders_due_date')} <span className="text-gray-600 font-semibold">{dateStr}</span> 
                        {item.amount > 0 && <><span className="w-1 h-1 bg-gray-300 rounded-full"></span> <span className="text-emerald-600 font-bold">{item.amount.toLocaleString('vi-VN')}đ</span></>}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <div className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-widest font-black border ${badgeClass}`}>
                      {badgeText}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button 
                        onClick={() => handleToggleComplete(item)}
                        className={`p-2 rounded-xl transition-all shadow-sm border ${item.isCompleted ? 'text-gray-400 hover:text-gray-600 bg-white border-gray-200/60 hover:bg-gray-50' : 'text-emerald-500 hover:text-emerald-600 bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50'}`}
                        title={item.isCompleted ? t('reminders_mark_undone') : t('reminders_mark_done')}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item._id)}
                        className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50/50 hover:bg-rose-50 shadow-sm border border-rose-100 rounded-xl transition-all"
                        title={t('reminders_delete')}
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

      <AddReminderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchReminders} 
      />
    </>
  );
};

export default Reminders;
