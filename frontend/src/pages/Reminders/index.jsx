import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCircle, Plus } from 'lucide-react';
import { getReminders, updateReminder, deleteReminder } from '../../services/reminderService';
import AddReminderModal from '../../components/AddReminderModal';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const data = await getReminders();
      setReminders(data);
    } catch (error) {
      console.error('Lỗi lấy nhắc nhở', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn muốn xóa nhắc nhở này?')) {
      try {
        await deleteReminder(id);
        fetchReminders();
      } catch (err) {
        alert('Lỗi xóa nhắc nhở');
      }
    }
  };

  const handleToggleComplete = async (reminder) => {
    try {
      await updateReminder(reminder._id, { isCompleted: !reminder.isCompleted });
      fetchReminders();
    } catch (err) {
      alert('Lỗi cập nhật trạng thái');
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl min-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Nhắc nhở hóa đơn</h2>
          <p className="text-sm text-gray-500 mt-1">Đừng bỏ lỡ các khoản thanh toán định kỳ</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Đang tải dữ liệu...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-xl">Không có nhắc nhở nào.</div>
        ) : (
          reminders.map((item) => {
            const daysLeft = calculateDaysLeft(item.dueDate);
            const isOverdue = daysLeft < 0;
            const dateObj = new Date(item.dueDate);
            const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
            
            let badgeClass = 'bg-green-100 text-green-700';
            let badgeText = `Còn ${daysLeft} ngày`;

            if (item.isCompleted) {
              badgeClass = 'bg-gray-100 text-gray-500';
              badgeText = 'Đã xong';
            } else if (isOverdue) {
              badgeClass = 'bg-red-100 text-red-700';
              badgeText = `Quá hạn ${Math.abs(daysLeft)} ngày`;
            } else if (daysLeft <= 3) {
              badgeClass = 'bg-yellow-100 text-yellow-700';
            }

            return (
              <div key={item._id} className={`flex items-center justify-between p-4 border rounded-xl hover:shadow-sm transition-shadow group ${item.isCompleted ? 'opacity-60 bg-gray-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.isCompleted ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-500'}`}>
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">Đến hạn: {dateStr} {item.amount > 0 && `- ${item.amount.toLocaleString('vi-VN')}đ`}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                    {badgeText}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button 
                      onClick={() => handleToggleComplete(item)}
                      className={`p-1 border rounded-md shadow-sm bg-white ${item.isCompleted ? 'text-gray-400 hover:text-gray-600' : 'text-green-500 hover:text-green-600'}`}
                      title={item.isCompleted ? "Đánh dấu chưa xong" : "Đánh dấu đã xong"}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item._id)}
                      className="p-1 text-gray-400 hover:text-red-600 bg-white shadow-sm border rounded-md"
                      title="Xóa"
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

      <AddReminderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchReminders} 
      />
    </div>
  );
};

export default Reminders;
