import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getMonthlyReport } from '../../services/analyticsService';
import { useTheme } from '../../context/ThemeContext';

const Reports = () => {
  const [data, setData] = useState({ totalAmount: 0, reportData: [] });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [reportType, setReportType] = useState('expense'); // State quản lý tab đang chọn: 'expense', 'income', 'all'
  const { t } = useTheme();

  const categoryTranslation = {
    'food': t('cat_food'),
    'transport': t('cat_transport'),
    'shopping': t('cat_shopping'),
    'bills': t('cat_bills'),
    'entertainment': t('cat_entertainment'),
    'other': t('cat_other')
  };

  // Mỗi khi selectedMonth hoặc reportType thay đổi, useEffect sẽ tự động kích hoạt lấy dữ liệu mới
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await getMonthlyReport(selectedMonth, reportType);
        setData(res);
      } catch (err) {
        console.error(t('reports_error_fetch'), err);
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
      filename: `${t('reports_pdf_filename')}${reportType}_${selectedMonth}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(options).from(element).save();
  };

  const handleExportExcel = () => {
    if (data.reportData.length === 0) return alert(t('reports_no_data_excel'));

    const excelRows = data.reportData.map((item, index) => ({
      [t('reports_col_stt')]: index + 1,
      [t('reports_col_cat')]: categoryTranslation[item.name] || item.name,
      [t('reports_col_amount')]: item.value,
      [t('reports_col_percent')]: item.percentage
    }));

    excelRows.push({
      [t('reports_col_stt')]: '',
      [t('reports_col_cat')]: t('reports_total_row'),
      [t('reports_col_amount')]: data.totalAmount,
      [t('reports_col_percent')]: '100%'
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('reports_sheet_name'));
    worksheet['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 18 }, { wch: 18 }];

    XLSX.writeFile(workbook, `${t('reports_pdf_filename')}${reportType}_${selectedMonth}.xlsx`);
  };

  // Xác định tiêu đề hiển thị linh hoạt theo Tab đang chọn
  const renderTitle = () => {
    if (reportType === 'expense') return t('reports_title_expense');
    if (reportType === 'income') return t('reports_title_income');
    return t('reports_title_all');
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-8 min-h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      
      {/* Header công cụ điều khiển */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">{t('reports_title')}</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Báo cáo thống kê chi tiết</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full xl:w-auto">
          
          {/* 🎯 BỘ NÚT CHUYỂN TAB ĐÃ ĐƯỢC KẾT NỐI VỚI STATE ĐỘNG */}
          <div className="flex bg-gray-100/80 p-1.5 rounded-xl shadow-inner w-full sm:w-auto">
            <button 
              onClick={() => setReportType('expense')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm transition-all ${
                reportType === 'expense' ? 'bg-white shadow-sm text-gray-800 font-bold' : 'text-gray-500 font-semibold hover:text-gray-700'
              }`}
            >
              {t('reports_tab_expense')}
            </button>
            <button 
              onClick={() => setReportType('income')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm transition-all ${
                reportType === 'income' ? 'bg-white shadow-sm text-gray-800 font-bold' : 'text-gray-500 font-semibold hover:text-gray-700'
              }`}
            >
              {t('reports_tab_income')}
            </button>
            <button 
              onClick={() => setReportType('all')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm transition-all ${
                reportType === 'all' ? 'bg-white shadow-sm text-gray-800 font-bold' : 'text-gray-500 font-semibold hover:text-gray-700'
              }`}
            >
              {t('reports_tab_all')}
            </button>
          </div>
          
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-200/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50/50 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer shadow-sm w-full sm:w-auto"
          >
            <option value="2026-07">{t('reports_month_july')}</option>
            <option value="2026-06">{t('reports_month_june')}</option>
          </select>

          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handleExportPDF} 
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-red-50 to-rose-100 text-rose-700 px-4 py-2.5 rounded-xl text-sm font-bold border border-rose-200/50 hover:shadow-md hover:shadow-rose-100 hover:-translate-y-0.5 transition-all"
            >
              {t('reports_export_pdf')}
            </button>
            
            <button 
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-bold border border-emerald-200/50 hover:shadow-md hover:shadow-emerald-100 hover:-translate-y-0.5 transition-all"
            >
              {t('reports_export_excel')}
            </button>
          </div>
        </div>
      </div>

      <hr className="border-gray-100/60 mb-8" />

      {/* Vùng nội dung báo cáo dữ liệu động */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 font-medium">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
          {t('reports_loading')}
        </div>
      ) : (
        <div id="report-content" className="p-4 bg-white/50 rounded-2xl">
          <div className="mb-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{renderTitle()}</p>
            <h3 className="text-3xl font-extrabold text-gray-800 mt-2 tracking-tight">
              {data.totalAmount.toLocaleString('vi-VN')}đ
            </h3>
          </div>

          {data.reportData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
              <span className="font-medium">{t('reports_no_data')}</span>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-center gap-16 mt-8">
              
              {/* Vùng render vòng tròn biểu đồ tròn tương ứng theo dữ liệu động */}
              <div className="w-72 h-72 relative flex items-center justify-center shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.reportData}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.reportData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center bg-white/50 backdrop-blur-md w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-sm border border-gray-100/50">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('reports_ratio')}</p>
                  <p className="text-xl font-black text-gray-800 tracking-tight mt-0.5">100%</p>
                </div>
              </div>

              {/* Danh sách nhãn chú thích bên phải */}
              <div className="flex-1 w-full max-w-md bg-gray-50/50 p-6 rounded-2xl border border-gray-100/60">
                <ul className="space-y-4">
                  {data.reportData.map((item, index) => (
                    <li key={index} className="flex items-center justify-between text-sm group hover:bg-white p-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full shadow-sm border border-white flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        </div>
                        <span className="text-gray-700 font-bold group-hover:text-gray-900 transition-colors">
                          {categoryTranslation[item.name] || item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-extrabold text-gray-800 tracking-tight">{item.value.toLocaleString('vi-VN')}đ</span>
                        <span className="text-gray-400 w-14 text-right font-semibold bg-gray-100 px-2 py-1 rounded-md text-xs">{item.percentage}</span>
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