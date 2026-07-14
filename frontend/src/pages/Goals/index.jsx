import React, { useState, useEffect } from 'react';
import { Plus, Target, Trash2, Calendar, DollarSign, Edit2 } from 'lucide-react';
import { getGoals, createGoal, updateGoalAmount, deleteGoal } from '../../services/goalService';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setError('Không thể kết nối API Mục tiêu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsData();
  }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadline) return alert('Vui lòng điền đủ thông tin bắt buộc!');

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
      alert('Lỗi khi thêm mục tiêu mới!');
    }
  };

  const handleUpdateAmount = async (id, oldAmount) => {
    const newAmount = prompt('Nhập tổng số tiền đã tích lũy hiện tại:', oldAmount);
    if (newAmount === null || newAmount === '') return;
    if (isNaN(newAmount)) return alert('Vui lòng nhập số hợp lệ!');

    try {
      await updateGoalAmount(id, Number(newAmount));
      fetchGoalsData();
    } catch (err) {
      alert('Lỗi khi cập nhật tiến độ mục tiêu!');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mục tiêu này?')) {
      try {
        await deleteGoal(id);
        fetchGoalsData();
      } catch (err) {
        alert('Lỗi khi xóa mục tiêu!');
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[calc(100vh-8rem)] p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Mục tiêu tài chính</h2>
          <p className="text-sm text-gray-500 mt-1">Lập kế hoạch và tích lũy cho những dự định tương lai</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm mục tiêu
        </button>
      </div>

      {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải dữ liệu mục tiêu...</div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 text-gray-400 flex flex-col items-center justify-center gap-2">
          <Target className="w-12 h-12 text-gray-300" />
          Chưa có mục tiêu nào được tạo. Hãy bắt đầu lên kế hoạch ngay!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            let percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            if (percent > 100) percent = 100;

            return (
              <div key={goal._id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow relative bg-gray-50/30">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-base">{goal.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> Hạn chót: {new Date(goal.deadline).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleUpdateAmount(goal._id, goal.currentAmount)}
                      className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                      title="Cập nhật số tiền"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(goal._id)}
                      className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Đã tích lũy:</span>
                    <span className="font-semibold text-gray-800">{goal.currentAmount.toLocaleString('vi-VN')}đ / {goal.targetAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                  
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      {Math.round(percent)}% Hoàn thành
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL THÊM MỤC TIÊU */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Thêm Mục Tiêu Tài Chính</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Tên mục tiêu *</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Mua Laptop mới, Tiết kiệm cưới..." 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Số tiền cần đạt (đ) *</label>
                <input 
                  type="number" 
                  placeholder="Ví dụ: 20000000" 
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Số tiền có sẵn (đ)</label>
                <input 
                  type="number" 
                  placeholder="Có sẵn (mặc định bằng 0)" 
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Hạn chót hoàn thành *</label>
                <input 
                  type="date" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-green-500 bg-gray-50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 text-sm font-medium">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Tạo mục tiêu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;