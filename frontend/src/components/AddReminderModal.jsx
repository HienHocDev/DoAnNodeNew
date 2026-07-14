import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { createReminder } from '../services/reminderService';
import { useTheme } from '../context/ThemeContext';

const AddReminderModal = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setAmount('');
      setDueDate('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title || !dueDate) {
      setError(t('reminders_modal_err_validation'));
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await createReminder({
        title,
        amount: amount ? Number(amount) : 0,
        dueDate
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('reminders_modal_err_add'));
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
        
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{t('reminders_modal_title')}</h2>
        </div>

        <div className="p-6 space-y-5">
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reminders_modal_title_label')}</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reminders_modal_amount_label')}</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none pr-8 text-right"
              />
              <span className="absolute right-3 top-2 text-gray-500 font-medium">đ</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reminders_modal_due_date_label')}</label>
            <input 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-500 outline-none" 
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t">
          <button 
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-white border rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('reminders_modal_cancel')}
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 rounded-lg font-medium text-white hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? t('reminders_modal_save_loading') : t('reminders_modal_save')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddReminderModal;
