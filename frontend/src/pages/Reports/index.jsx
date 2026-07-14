import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getMonthlyReport } from '../../services/analyticsService';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Reports = () => {
  const [data, setData] = useState({ totalAmount: 0, totalIncome: 0, totalExpense: 0, difference: 0, reportData: [] });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('expense'); // State quản lý tab đang chọn: 'expense', 'income', 'all'
  const { t } = useTheme();
  const { user } = useAuth();

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
        setError('');
        const res = await getMonthlyReport(selectedMonth, reportType);
        setData(res);
      } catch (err) {
        console.error(t('reports_error_fetch'), err);
        setError(t('reports_error_fetch'));
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedMonth, reportType, t]);

  const getExportMetadata = () => {
    const [year, month] = selectedMonth.split('-');
    const reportTypeLabel = reportType === 'expense' ? 'Chi tiêu' : reportType === 'income' ? 'Thu nhập' : 'Tổng quan';
    const exportedAt = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date());
    return {
      userName: user?.name || 'Chưa cập nhật',
      email: user?.email || 'Chưa cập nhật',
      reportTypeLabel,
      period: `Tháng ${month}/${year}`,
      exportedAt
    };
  };

  const getExportRows = () => {
    if (reportType === 'all') {
      return [
        { name: 'Tổng thu nhập', value: data.totalIncome, percentage: '-' },
        { name: 'Tổng chi tiêu', value: data.totalExpense, percentage: '-' },
        { name: 'Chênh lệch', value: data.difference, percentage: '-' }
      ];
    }
    return data.reportData.map((item) => ({
      name: categoryTranslation[item.name] || item.name,
      value: item.value,
      percentage: item.percentage
    }));
  };

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));

  const handleExportPDF = async () => {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) {
      alert('Báo cáo chưa sẵn sàng để xuất PDF. Vui lòng thử lại.');
      return;
    }

    const metadata = getExportMetadata();
    const rows = getExportRows();
    const exportHost = document.createElement('div');
    exportHost.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#ffffff;opacity:1;visibility:visible;display:block;overflow:visible;z-index:-1;';
    const exportElement = document.createElement('div');
    exportElement.style.cssText = 'box-sizing:border-box;width:794px;min-height:1123px;padding:32px;background:#ffffff;color:#1f2937;font-family:Arial,sans-serif;opacity:1;visibility:visible;display:block;';
    exportElement.innerHTML = `
      <header style="text-align:center;border-bottom:3px solid #10b981;padding-bottom:18px;margin-bottom:22px">
        <div style="font-size:28px;font-weight:800;color:#059669;letter-spacing:1px">FINANCE TRACKER</div>
        <div style="font-size:20px;font-weight:700;margin-top:7px">BÁO CÁO TÀI CHÍNH CÁ NHÂN</div>
      </header>
      <section style="display:grid;grid-template-columns:1fr 1fr;gap:8px 32px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin-bottom:20px;font-size:13px">
        <div><strong>Người dùng:</strong> ${escapeHtml(metadata.userName)}</div>
        <div><strong>Email:</strong> ${escapeHtml(metadata.email)}</div>
        <div><strong>Loại báo cáo:</strong> ${escapeHtml(metadata.reportTypeLabel)}</div>
        <div><strong>Thời gian:</strong> ${escapeHtml(metadata.period)}</div>
        <div style="grid-column:1 / -1"><strong>Ngày xuất:</strong> ${escapeHtml(metadata.exportedAt)}</div>
      </section>
      <section style="background:#ecfdf5;border:1px solid #a7f3d0;padding:14px 18px;margin-bottom:20px;font-size:15px;color:#065f46">
        <strong>Tổng tiền tương ứng:</strong> ${data.totalAmount.toLocaleString('vi-VN')}đ
      </section>`;

    const chartSection = document.createElement('section');
    chartSection.style.cssText = 'margin:18px 0 24px;text-align:center;page-break-inside:avoid;background:#ffffff;color:#1f2937;';
    chartSection.innerHTML = '<h3 style="font-size:17px;text-align:left;margin:0 0 12px;color:#1f2937">BIỂU ĐỒ</h3>';
    const chartSvg = reportContent.querySelector('svg.recharts-surface');
    if (chartSvg && rows.length > 0) {
      const svgClone = chartSvg.cloneNode(true);
      svgClone.setAttribute('width', '360');
      svgClone.setAttribute('height', '260');
      svgClone.style.cssText = 'display:block;width:360px;height:260px;margin:0 auto;background:#ffffff;';
      chartSection.appendChild(svgClone);
    } else {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'Không có dữ liệu trong kỳ này';
      emptyMessage.style.cssText = 'padding:48px 16px;border:1px dashed #cbd5e1;background:#f8fafc;color:#64748b;font-size:14px;';
      chartSection.appendChild(emptyMessage);
    }
    exportElement.appendChild(chartSection);

    const statistics = document.createElement('section');
    statistics.style.cssText = 'margin-top:24px;page-break-inside:avoid;';
    statistics.innerHTML = `
      <h3 style="font-size:17px;margin:0 0 12px">BẢNG THỐNG KÊ</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:#059669;color:#fff">
          <th style="padding:10px;border:1px solid #d1d5db;text-align:left">Danh mục/Loại</th>
          <th style="padding:10px;border:1px solid #d1d5db;text-align:right">Số tiền</th>
          <th style="padding:10px;border:1px solid #d1d5db;text-align:right">Tỷ lệ</th>
        </tr></thead>
        <tbody>${rows.length ? rows.map((row) => `<tr>
          <td style="padding:9px;border:1px solid #d1d5db">${escapeHtml(row.name)}</td>
          <td style="padding:9px;border:1px solid #d1d5db;text-align:right;font-weight:700">${row.value.toLocaleString('vi-VN')}đ</td>
          <td style="padding:9px;border:1px solid #d1d5db;text-align:right">${row.percentage}</td>
        </tr>`).join('') : '<tr><td colspan="3" style="padding:18px;border:1px solid #d1d5db;text-align:center;color:#64748b">Không có dữ liệu trong kỳ này</td></tr>'}</tbody>
      </table>`;
    exportElement.appendChild(statistics);

    const footer = document.createElement('footer');
    footer.style.cssText = 'margin-top:28px;padding-top:14px;border-top:1px solid #d1d5db;text-align:center;color:#6b7280;font-size:11px;line-height:1.7;';
    footer.innerHTML = 'Generated by Finance Tracker<br>© 2026 Finance Tracker';
    exportElement.appendChild(footer);
    exportHost.appendChild(exportElement);
    document.body.appendChild(exportHost);

    const options = {
      margin: [10, 10, 10, 10],
      filename: `${t('reports_pdf_filename')}${reportType}_${selectedMonth}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await html2pdf().set(options).from(exportElement).save();
    } catch (exportError) {
      console.error('Lỗi xuất PDF Reports:', exportError);
      alert('Xuất PDF thất bại. Vui lòng thử lại.');
    } finally {
      exportHost.remove();
    }
  };

  const handleExportExcel = () => {
    if (data.reportData.length === 0) return alert(t('reports_no_data_excel'));

    const metadata = getExportMetadata();
    const rows = getExportRows();
    const worksheetData = [
      ['FINANCE TRACKER'],
      ['BÁO CÁO TÀI CHÍNH CÁ NHÂN'],
      [],
      ['Người dùng:', metadata.userName],
      ['Email:', metadata.email],
      ['Loại báo cáo:', metadata.reportTypeLabel],
      ['Tháng:', metadata.period],
      ['Ngày xuất:', metadata.exportedAt],
      [],
      ['STT', 'Danh mục/Loại', 'Số tiền (VNĐ)', 'Tỷ lệ %'],
      ...rows.map((item, index) => [index + 1, item.name, item.value, item.percentage]),
      [],
      ['', 'TỔNG CỘNG', data.totalAmount, '100%']
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('reports_sheet_name'));
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
    ];
    worksheet['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 20 }, { wch: 15 }];

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
          
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-200/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50/50 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer shadow-sm w-full sm:w-auto"
          />

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
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-rose-500 font-medium">{error}</div>
      ) : (
        <div id="report-content" className="p-4 bg-white/50 rounded-2xl">
          <div className="mb-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{renderTitle()}</p>
            <h3 className="text-3xl font-extrabold text-gray-800 mt-2 tracking-tight">
              {data.totalAmount.toLocaleString('vi-VN')}đ
            </h3>
            {reportType === 'all' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-sm">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">Tổng thu nhập: <strong>{data.totalIncome.toLocaleString('vi-VN')}đ</strong></div>
                <div className="rounded-xl bg-rose-50 p-3 text-rose-700">Tổng chi tiêu: <strong>{data.totalExpense.toLocaleString('vi-VN')}đ</strong></div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-700">Chênh lệch: <strong>{data.difference.toLocaleString('vi-VN')}đ</strong></div>
              </div>
            )}
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
