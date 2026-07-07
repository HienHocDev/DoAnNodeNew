import React, { useState, useEffect } from 'react';
import { Search, Plus, Coffee, ShoppingBag, Receipt, Car, ArrowDownCircle, ArrowUpCircle, Gamepad2, MoreHorizontal } from 'lucide-react';
import AddTransactionModal from '../../components/AddTransactionModal';
import { getTransactions } from '../../services/transactionService';

const getCategoryDetails = (categoryId) => {
  const map = {
    'food': { name: 'Ăn uống', icon: Coffee, color: 'text-orange-500' },
    'transport': { name: 'Di chuyển', icon: Car, color: 'text-blue-500' },
    'shopping': { name: 'Mua sắm', icon: ShoppingBag, color: 'text-purple-500' },
    'bills': { name: 'Hóa đơn', icon: Receipt, color: 'text-red-500' },
    'entertainment': { name: 'Giải trí', icon: Gamepad2, color: 'text-pink-500' },
    'other': { name: 'Khác', icon: MoreHorizontal, color: 'text-gray-500' },
    'salary': { name: 'Lương', icon: ArrowUpCircle, color: 'text-green-500' },
  };
  return map[categoryId] || { name: categoryId, icon: MoreHorizontal, color: 'text-gray-500' };
};

const Transactions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions();
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError('Lỗi khi tải giao dịch. Bạn đã đăng nhập chưa?');
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[calc(100vh-8rem)]">
      {/* Header & Toolbar */}
      <div className="p-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-green-500">
            <option>Tháng 06/2025</option>
            <option>Tháng 05/2025</option>
          </select>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button className="px-4 py-1.5 bg-white shadow-sm rounded-md text-sm font-medium text-gray-800">Tất cả</button>
            <button className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800">Thu nhập</button>
            <button className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800">Chi tiêu</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm giao dịch" 
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Thêm giao dịch
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có giao dịch nào.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-gray-500 text-sm">
                <th className="font-medium p-4 pl-6">Ngày</th>
                <th className="font-medium p-4">Danh mục</th>
                <th className="font-medium p-4">Nội dung</th>
                <th className="font-medium p-4 text-right">Số tiền</th>
                <th className="font-medium p-4">Loại</th>
                <th className="font-medium p-4">Ví</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const catDetails = getCategoryDetails(tx.category);
                const IconComponent = catDetails.icon;
                const dateObj = new Date(tx.date);
                const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
                
                return (
                  <tr key={tx._id} className="border-b hover:bg-gray-50/50 transition-colors group cursor-pointer">
                    <td className="p-4 pl-6 text-sm text-gray-600">{dateStr}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <IconComponent className={`w-4 h-4 ${catDetails.color}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-800">{catDetails.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{tx.note || '-'}</td>
                    <td className={`p-4 text-right font-medium text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{tx.wallet?.name || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleTransactionAdded} 
      />
    </div>
  );
};

export default Transactions;
