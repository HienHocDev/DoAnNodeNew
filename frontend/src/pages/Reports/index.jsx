import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
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

  const getPdfSummary = (rows) => {
    if (reportType === 'all') {
      if (data.difference > 0) {
        return `Thu nhập cao hơn chi tiêu ${data.difference.toLocaleString('vi-VN')}đ. Kỳ báo cáo đang ghi nhận thặng dư và khả năng tích lũy tích cực.`;
      }
      if (data.difference < 0) {
        return `Chi tiêu cao hơn thu nhập ${Math.abs(data.difference).toLocaleString('vi-VN')}đ. Nên rà soát các khoản chi lớn để cân bằng dòng tiền.`;
      }
      return 'Thu nhập và chi tiêu đang cân bằng trong kỳ báo cáo.';
    }
    if (!rows.length) return 'Chưa có dữ liệu phát sinh trong kỳ để đưa ra đánh giá.';
    const leading = [...rows].sort((first, second) => second.value - first.value)[0];
    return `${leading.name} là nhóm chiếm tỷ trọng lớn nhất với ${leading.value.toLocaleString('vi-VN')}đ (${leading.percentage}). Báo cáo được tổng hợp từ dữ liệu giao dịch thực tế trong kỳ.`;
  };

  const handleExportPDF = async () => {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) {
      alert('Báo cáo chưa sẵn sàng để xuất PDF. Vui lòng thử lại.');
      return;
    }

    const metadata = getExportMetadata();
    const rows = getExportRows();
    const leadingRow = rows.length ? [...rows].sort((first, second) => second.value - first.value)[0] : null;
    const summaryCards = reportType === 'all'
      ? [
          { label: 'Tổng thu nhập', value: data.totalIncome, color: '#047857', background: '#ecfdf5' },
          { label: 'Tổng chi tiêu', value: data.totalExpense, color: '#be123c', background: '#fff1f2' },
          { label: 'Chênh lệch', value: data.difference, color: '#1d4ed8', background: '#eff6ff' }
        ]
      : [
          { label: reportType === 'expense' ? 'Tổng chi tiêu' : 'Tổng thu nhập', value: data.totalAmount, color: '#047857', background: '#ecfdf5' },
          { label: 'Số danh mục', display: String(rows.length), color: '#1d4ed8', background: '#eff6ff' },
          {
            label: 'Danh mục nổi bật',
            display: leadingRow?.name || 'Chưa có dữ liệu',
            subtext: leadingRow ? `${leadingRow.value.toLocaleString('vi-VN')}đ · ${leadingRow.percentage}` : '',
            color: '#6d28d9',
            background: '#f5f3ff'
          }
        ];
    const pdfSummary = getPdfSummary(rows);
    const exportHost = document.createElement('div');
    exportHost.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#ffffff;opacity:1;visibility:visible;display:block;overflow:visible;z-index:-1;';
    const exportElement = document.createElement('div');
    exportElement.style.cssText = 'box-sizing:border-box;width:760px;margin:0 auto;padding:0 24px 16px;background:#f8fafc;color:#172033;font-family:"Segoe UI",Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.4;opacity:1;visibility:visible;display:block;overflow:hidden;';
    exportElement.innerHTML = `
      <header style="margin:0 -24px 13px;padding:16px 26px 15px;background:#064e3b;color:#ffffff">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px">
          <div>
            <div style="font-size:12px;font-weight:700;letter-spacing:2.4px;color:#a7f3d0">FINANCE TRACKER</div>
            <div style="font-size:22px;font-weight:800;line-height:1.15;margin-top:5px">BÁO CÁO TÀI CHÍNH CÁ NHÂN</div>
            <div style="font-size:11px;color:#d1fae5;margin-top:5px">Báo cáo quản trị · Dữ liệu giao dịch thực tế</div>
          </div>
          <div style="width:145px;box-sizing:border-box;border:1px solid #34d399;background:#065f46;padding:8px 10px;text-align:right;overflow:hidden">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#a7f3d0">Kỳ báo cáo</div>
            <div style="font-size:15px;font-weight:800;margin-top:4px">${escapeHtml(metadata.period)}</div>
            <div style="font-size:11px;color:#d1fae5;margin-top:3px">${escapeHtml(metadata.reportTypeLabel)}</div>
          </div>
        </div>
      </header>
      <section style="display:flex;justify-content:space-between;gap:18px;margin-bottom:10px;padding:0 3px;font-size:10px;color:#64748b">
        <div style="width:47%;overflow-wrap:anywhere"><span style="display:block;text-transform:uppercase;font-size:9px;letter-spacing:.8px;color:#94a3b8">Người dùng</span><strong style="display:block;color:#334155;margin-top:3px">${escapeHtml(metadata.userName)}</strong><span>${escapeHtml(metadata.email)}</span></div>
        <div style="width:47%;text-align:right;overflow-wrap:anywhere"><span style="display:block;text-transform:uppercase;font-size:9px;letter-spacing:.8px;color:#94a3b8">Thời điểm xuất</span><strong style="display:block;color:#334155;margin-top:3px">${escapeHtml(metadata.exportedAt)}</strong><span>Tài liệu dành cho mục đích báo cáo</span></div>
      </section>
      <section style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:11px">
        ${summaryCards.map((card) => `
          <div style="min-height:65px;box-sizing:border-box;border:1px solid #e2e8f0;border-top:3px solid ${card.color};background:#ffffff;padding:8px 11px 10px">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#64748b">${escapeHtml(card.label)}</div>
            <div style="font-size:${card.display && card.display.length > 18 ? '13px' : '17px'};font-weight:800;line-height:1.35;color:${card.color};margin-top:4px;white-space:normal;overflow:visible;overflow-wrap:anywhere">
              ${card.display ? escapeHtml(card.display) : `${Number(card.value || 0).toLocaleString('vi-VN')}đ`}
            </div>
            ${card.subtext ? `<div style="font-size:9px;color:#64748b;margin-top:2px">${escapeHtml(card.subtext)}</div>` : ''}
          </div>
        `).join('')}
      </section>`;

    const chartSection = document.createElement('section');
    chartSection.style.cssText = 'box-sizing:border-box;width:712px;margin:0 0 10px;padding:11px 14px;border:1px solid #e2e8f0;background:#ffffff;color:#172033;overflow:visible;display:block;visibility:visible;opacity:1;';
    chartSection.innerHTML = '<div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669">Phân tích cơ cấu</div><h3 style="font-size:15px;text-align:left;margin:2px 0;color:#172033">Phân bổ theo danh mục</h3><p style="font-size:9px;text-align:left;margin:0 0 5px;color:#64748b">Tỷ trọng được tổng hợp theo dữ liệu của kỳ báo cáo</p>';
    let exportChartRoot = null;
    if (data.reportData.length > 0) {
      const chartLayout = document.createElement('div');
      chartLayout.style.cssText = 'display:flex;align-items:center;gap:12px;width:682px;min-height:220px;';
      const chartMount = document.createElement('div');
      chartMount.style.cssText = 'width:430px;height:220px;flex:0 0 430px;background:#ffffff;overflow:visible;display:block;visibility:visible;opacity:1;';
      chartLayout.appendChild(chartMount);

      const chartLegend = document.createElement('div');
      chartLegend.style.cssText = 'box-sizing:border-box;width:240px;padding:5px 9px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155;font-size:9px;overflow:hidden;';
      data.reportData.forEach((item) => {
        const legendItem = document.createElement('div');
        legendItem.style.cssText = 'display:grid;grid-template-columns:9px 1fr auto;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid #e2e8f0;';
        const color = document.createElement('span');
        color.style.cssText = `display:inline-block;width:9px;height:9px;border-radius:50%;background:${item.color};`;
        const label = document.createElement('span');
        label.innerHTML = `<strong style="display:block;font-size:10px">${escapeHtml(categoryTranslation[item.name] || item.name)}</strong><span style="display:block;color:#64748b;margin-top:2px">${item.value.toLocaleString('vi-VN')}đ</span>`;
        const percentage = document.createElement('strong');
        percentage.textContent = item.percentage;
        percentage.style.cssText = 'color:#475569;background:#ffffff;border:1px solid #e2e8f0;padding:3px 5px;';
        legendItem.append(color, label, percentage);
        chartLegend.appendChild(legendItem);
      });
      chartLayout.appendChild(chartLegend);
      chartSection.appendChild(chartLayout);

      exportChartRoot = createRoot(chartMount);
      exportChartRoot.render(
        <PieChart width={430} height={220}>
          <Pie
            data={data.reportData}
            cx={215}
            cy={110}
            innerRadius={58}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.reportData.map((entry, index) => (
              <Cell key={`pdf-cell-${entry.name}-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      );
    } else {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'Không có dữ liệu trong kỳ này';
      emptyMessage.style.cssText = 'padding:48px 16px;border:1px dashed #cbd5e1;background:#f8fafc;color:#64748b;font-size:14px;';
      chartSection.appendChild(emptyMessage);
    }
    exportElement.appendChild(chartSection);

    const statistics = document.createElement('section');
    statistics.style.cssText = 'margin-top:0;padding:10px 14px;border:1px solid #e2e8f0;background:#ffffff;';
    statistics.innerHTML = `
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669">Chi tiết số liệu</div>
      <h3 style="font-size:15px;margin:2px 0 7px">BẢNG THỐNG KÊ</h3>
      <table style="width:100%;border-collapse:collapse;font-size:10px">
        <thead><tr style="background:#064e3b;color:#fff">
          <th style="width:34px;padding:6px;text-align:center">STT</th>
          <th style="padding:6px 8px;text-align:left">Danh mục / Loại</th>
          <th style="width:150px;padding:6px 8px;text-align:right">Số tiền (VNĐ)</th>
          <th style="width:78px;padding:6px 8px;text-align:right">Tỷ lệ</th>
        </tr></thead>
        <tbody>${rows.length ? rows.map((row, index) => `<tr style="background:${index % 2 ? '#f8fafc' : '#ffffff'};border-bottom:1px solid #e2e8f0">
          <td style="padding:6px;text-align:center;color:#64748b">${index + 1}</td>
          <td style="padding:6px 8px;font-weight:700;color:#334155">${escapeHtml(row.name)}</td>
          <td style="padding:6px 8px;text-align:right;font-weight:800;color:#172033">${row.value.toLocaleString('vi-VN')}đ</td>
          <td style="padding:6px 8px;text-align:right;font-weight:700;color:#059669">${escapeHtml(row.percentage)}</td>
        </tr>`).join('') : '<tr><td colspan="4" style="padding:20px;text-align:center;color:#64748b">Không có dữ liệu trong kỳ này</td></tr>'}</tbody>
      </table>`;
    exportElement.appendChild(statistics);

    const assessment = document.createElement('section');
    assessment.style.cssText = 'margin-top:9px;padding:9px 12px;border-left:4px solid #10b981;background:#ecfdf5;';
    assessment.innerHTML = `
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#047857">Đánh giá tổng quan</div>
      <p style="margin:4px 0 0;font-size:10px;line-height:1.4;color:#334155">${escapeHtml(pdfSummary)}</p>
    `;
    exportElement.appendChild(assessment);

    const footer = document.createElement('footer');
    footer.style.cssText = 'margin-top:9px;padding:7px 3px 0;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;gap:20px;align-items:flex-end;color:#64748b;font-size:8px;line-height:1.4;';
    footer.innerHTML = '<div style="width:46%;overflow-wrap:anywhere"><strong style="display:block;color:#064e3b;font-size:10px">FINANCE TRACKER</strong>Generated by Finance Tracker · Báo cáo tài chính cá nhân</div><div style="width:46%;text-align:right;overflow-wrap:anywhere">Tài liệu được tạo tự động từ dữ liệu hệ thống<br>© 2026 Finance Tracker</div>';
    exportElement.appendChild(footer);
    exportHost.appendChild(exportElement);
    document.body.appendChild(exportHost);

    const options = {
      margin: [4, 4, 4, 4],
      filename: `${t('reports_pdf_filename')}${reportType}_${selectedMonth}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['legacy'] }
    };
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 150));
      await html2pdf().set(options).from(exportElement).save();
    } catch (exportError) {
      console.error('Lỗi xuất PDF Reports:', exportError);
      alert('Xuất PDF thất bại. Vui lòng thử lại.');
    } finally {
      exportChartRoot?.unmount();
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
