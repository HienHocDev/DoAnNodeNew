import React, { useState } from 'react';
import { Search, Plus, Coffee, ShoppingBag, Receipt, Car, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import AddTransactionModal from '../../components/AddTransactionModal';

const Transactions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const transactions = [
    { id: 1, date: '30/06/2025', category: 'Lương tháng 6', icon: ArrowUpCircle, iconColor: 'text-green-500', note: '', amount: 25000000, type: 'income', wallet: 'Ví chính' },
    { id: 2, date: '30/06/2025', category: 'Ăn sáng', icon: Coffee, iconColor: 'text-orange-500', note: '', amount: -45000, type: 'expense', wallet: 'Ví chính' },
    { id: 3, date: '29/06/2025', category: 'Đi siêu thị', icon: ShoppingBag, iconColor: 'text-purple-500', note: '', amount: -350000, type: 'expense', wallet: 'Ví chính' },
    { id: 4, date: '28/06/2025', category: 'Tiền thưởng', icon: ArrowUpCircle, iconColor: 'text-green-500', note: '', amount: 3500000, type: 'income', wallet: 'Ví chính' },
    { id: 5, date: '28/06/2025', category: 'GrabBike', icon: Car, iconColor: 'text-blue-500', note: '', amount: -35000, type: 'expense', wallet: 'Ví chính' },
    { id: 6, date: '27/06/2025', category: 'Hóa đơn điện', icon: Receipt, iconColor: 'text-red-500', note: '', amount: -1200000, type: 'expense', wallet: 'Ví chính' },
  ];

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
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b hover:bg-gray-50/50 transition-colors group cursor-pointer">
                <td className="p-4 pl-6 text-sm text-gray-600">{tx.date}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <tx.icon className={`w-4 h-4 ${tx.iconColor}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-800">{tx.category}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-600">{tx.note || '-'}</td>
                <td className={`p-4 text-right font-medium text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}đ
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">{tx.wallet}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Transactions;
