import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getMonthlyReport } from '../../services/analyticsService';

const Reports = () => {
  const [data, setData] = useState({ totalAmount: 0, reportData: [] });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [reportType, setReportType] = useState('expense'); // State quản lý tab đang chọn: 'expense', 'income', 'all'

  const categoryTranslation = {
    'food': 'Ăn uống',
    'transport': 'Di chuyển',
    'shopping': 'Mua sắm',
    'bills': 'Hóa đơn',
    'entertainment': 'Giải trí',
    'other': 'Khác'
  };

  // Mỗi khi selectedMonth hoặc reportType thay đổi, useEffect sẽ tự động kích hoạt lấy dữ liệu mới
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await getMonthlyReport(selectedMonth, reportType);
        setData(res);
      } catch (err) {
        console.error('Lỗi tải báo cáo:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedMonth, reportType]);

  const handleExportPDF = () => {
    const element = document.getElementById('report-content');
    const options = {
      margin: [10, 10, 10, 10],
      filename: `Bao_cao_${reportType}_${selectedMonth}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(options).from(element).save();
  };

  const handleExportExcel = () => {
    if (data.reportData.length === 0) return alert('Không có dữ liệu để xuất Excel!');

    const excelRows = data.reportData.map((item, index) => ({
      'STT': index + 1,
      'Danh mục / Loại': categoryTranslation[item.name] || item.name,
      'Số tiền (VNĐ)': item.value,
      'Tỷ lệ phần trăm': item.percentage
    }));

    excelRows.push({
      'STT': '',
      'Danh mục / Loại': 'TỔNG CỘNG',
      'Số tiền (VNĐ)': data.totalAmount,
      'Tỷ lệ phần trăm': '100%'
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo cáo chi tiết');
    worksheet['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 18 }, { wch: 18 }];

    XLSX.writeFile(workbook, `Bao_cao_${reportType}_${selectedMonth}.xlsx`);
  };

  // Xác định tiêu đề hiển thị linh hoạt theo Tab đang chọn
  const renderTitle = () => {
    if (reportType === 'expense') return 'Tổng chi tiêu';
    if (reportType === 'income') return 'Tổng thu nhập';
    return 'Tổng lưu lượng giao dịch';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[calc(100vh-8rem)]">
      
      {/* Header công cụ điều khiển */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Báo cáo chi tiết</h2>
        <div className="flex items-center gap-3">
          
          {/* 🎯 BỘ NÚT CHUYỂN TAB ĐÃ ĐƯỢC KẾT NỐI VỚI STATE ĐỘNG */}
          <div className="flex bg-gray-100 p-1 rounded-lg text-sm">
            <button 
              onClick={() => setReportType('expense')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                reportType === 'expense' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Chi tiêu
            </button>
            <button 
              onClick={() => setReportType('income')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                reportType === 'income' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Thu nhập
            </button>
            <button 
              onClick={() => setReportType('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                reportType === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Tổng quan
            </button>
          </div>
          
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-200 rounded-lg p-1.5 text-sm text-gray-600 bg-white"
          >
            <option value="2026-07">Tháng 07/2026</option>
            <option value="2026-06">Tháng 06/2026</option>
          </select>

          <button 
            onClick={handleExportPDF} 
            className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-200 hover:bg-red-100 transition-colors"
          >
            Xuất PDF
          </button>
          
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-200 hover:bg-green-100 transition-colors"
          >
            Xuất Excel
          </button>
        </div>
      </div>

      <hr className="border-gray-100 mb-6" />

      {/* Vùng nội dung báo cáo dữ liệu động */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang cập nhật báo cáo mới...</div>
      ) : (
        <div id="report-content" className="p-4 bg-white">
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{renderTitle()}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {data.totalAmount.toLocaleString('vi-VN')}đ
            </h3>
          </div>

          {data.reportData.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Không tìm thấy dữ liệu giao dịch tương ứng trong tháng này.</div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 mt-8">
              
              {/* Vùng render vòng tròn biểu đồ tròn tương ứng theo dữ liệu động */}
              <div className="w-64 h-64 relative flex items-center justify-center shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.reportData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.reportData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <p className="text-xs text-gray-400 font-medium">Tỷ lệ</p>
                  <p className="text-lg font-bold text-gray-800">100%</p>
                </div>
              </div>

              {/* Danh sách nhãn chú thích bên phải */}
              <div className="flex-1 w-full max-w-md">
                <ul className="space-y-4">
                  {data.reportData.map((item, index) => (
                    <li key={index} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="text-gray-600 font-medium">
                          {categoryTranslation[item.name] || item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-semibold text-gray-800">{item.value.toLocaleString('vi-VN')}đ</span>
                        <span className="text-gray-400 w-12 text-right">{item.percentage}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;