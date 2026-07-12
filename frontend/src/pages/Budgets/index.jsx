import React, { useState, useEffect } from 'react';
import { Plus, Coffee, Car, ShoppingBag, Gamepad2, Receipt, HelpCircle, Trash2 } from 'lucide-react';
import { getBudgets, createBudget, deleteBudget } from '../../services/budgetService';

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

  const fetchBudgetsData = async () => {
    try {
      setLoading(true);
      const data = await getBudgets();
      setBudgets(data);
      setError('');
    } catch (err) {
      setError('Không thể kết nối API Ngân sách.');
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
    if (!category || !amount) return alert('Vui lòng điền đầy đủ thông tin!');

    try {
      // Gửi trường amount lên Backend
      await createBudget({ category, amount: Number(amount) }); 
      setIsModalOpen(false);
      setCategory('');
      setAmount('');
      fetchBudgetsData(); 
    } catch (err) {
      alert(err.response?.data?.msg || 'Lỗi khi thêm ngân sách!');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa ngân sách này?')) {
      try {
        await deleteBudget(id);
        fetchBudgetsData();
      } catch (err) {
        alert('Lỗi khi xóa ngân sách!');
      }
    }
  };

  const getProgressColor = (percent) => {
    if (percent < 70) return 'bg-green-500';
    if (percent < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[calc(100vh-8rem)] p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý Ngân sách</h2>
          <p className="text-sm text-gray-500 mt-1">Theo dõi giới hạn chi tiêu trong tháng</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm ngân sách
        </button>
      </div>

      {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải dữ liệu từ database...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Chưa có ngân sách nào cho tháng này. Hãy bấm thêm mới!</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-gray-500 text-sm">
                <th className="font-medium p-4 pl-0">Danh mục</th>
                <th className="font-medium p-4 text-right">Ngân sách</th>
                <th className="font-medium p-4 text-right">Đã chi</th>
                <th className="font-medium p-4 text-right">Còn lại</th>
                <th className="font-medium p-4 w-48 text-center">Tỷ lệ</th>
                <th className="font-medium p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((item) => {
                const totalExpense = item.totalExpense || 0;
                const remaining = item.amount - totalExpense; // Dùng item.amount
                let percent = item.amount > 0 ? (totalExpense / item.amount) * 100 : 0;
                if (percent > 100) percent = 100;

                const iconConfig = iconMap[item.category] || { icon: HelpCircle, color: 'text-gray-500' };
                const IconComponent = iconConfig.icon;

                return (
                  <tr key={item._id} className="border-b hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <IconComponent className={`w-4 h-4 ${iconConfig.color}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-800">{item.category}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-sm font-medium text-gray-700">{item.amount.toLocaleString('vi-VN')}đ</td>
                    <td className="p-4 text-right text-sm font-medium text-amber-600">{totalExpense.toLocaleString('vi-VN')}đ</td>
                    <td className="p-4 text-right text-sm font-medium text-emerald-600">{remaining.toLocaleString('vi-VN')}đ</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getProgressColor(percent)}`} 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-8">{Math.round(percent)}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDelete(item._id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
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

      {/* MODAL THÊM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Thêm Ngân Sách</h3>
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Danh mục</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50 outline-none focus:border-green-500"
                >
                  <option value="">-- Chọn danh mục --</option>
                  <option value="Ăn uống">Ăn uống</option>
                  <option value="Di chuyển">Di chuyển</option>
                  <option value="Mua sắm">Mua sắm</option>
                  <option value="Giải trí">Giải trí</option>
                  <option value="Hóa đơn">Hóa đơn</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Hạn mức giới hạn (đ)</label>
                <input 
                  type="number" 
                  placeholder="Ví dụ: 3000000" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-green-500"
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
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;