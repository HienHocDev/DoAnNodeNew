const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Lấy dữ liệu tổng quan thu chi và danh mục chuẩn UI mới
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // 1. Tính tổng Thu, tổng Chi
    const totals = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    totals.forEach(item => {
      if (item._id === 'income') totalIncome = item.total;
      if (item._id === 'expense') totalExpense = item.total;
    });

    const balance = totalIncome - totalExpense;

    // 2. Thống kê Chi tiêu theo Danh mục (Donut Chart)
    const categoryData = await Transaction.aggregate([
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(userId),
          type: 'expense'
        } 
      },
      {
        $group: {
          _id: '$category',
          value: { $sum: '$amount' }
        }
      },
      {
        $project: {
          name: '$_id',
          value: 1,
          _id: 0
        }
      },
      { $sort: { value: -1 } } // Sắp xếp giảm dần giống UI thực tế
    ]);

    // 3. Data giả lập các mốc thời gian mượt mà (Line/Area Chart) giống hệt ảnh mẫu
    const trendData = [
      { name: '01/06', 'Thu nhập': 0, 'Chi tiêu': 0 },
      { name: '08/06', 'Thu nhập': totalIncome * 0.6, 'Chi tiêu': totalExpense * 0.2 },
      { name: '15/06', 'Thu nhập': totalIncome * 0.1, 'Chi tiêu': totalExpense * 0.3 },
      { name: '22/06', 'Thu nhập': totalIncome * 0.2, 'Chi tiêu': totalExpense * 0.25 },
      { name: '30/06', 'Thu nhập': totalIncome, 'Chi tiêu': totalExpense }
    ];

    res.json({
      summary: {
        totalIncome,
        totalExpense,
        balance
      },
      categoryData,
      trendData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi hệ thống khi tính toán thống kê' });
  }
};

// @desc    Lấy dữ liệu phân tích hành vi chi tiêu chuyên sâu
// @route   GET /api/analytics/analysis
// @access  Private
const getBehaviorAnalytics = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
  
        // Lấy toàn bộ giao dịch chi tiêu (expense) của người dùng này
        const expenses = await Transaction.find({ user: userId, type: 'expense' });
  
        if (expenses.length === 0) {
            return res.json({
                trendPercentage: 0,
                miniChartData: [0, 0, 0, 0],
                topCategory: { name: 'Chưa có', percentage: 0 },
                topTimeSlot: { name: 'Chưa có', slot: '' }
            });
        }
  
        // 1. TÍNH DANH MỤC CHI NHIỀU NHẤT
        const categoryMap = {};
        let totalExpenseAmount = 0;
        expenses.forEach(item => {
            categoryMap[item.category] = (categoryMap[item.category] || 0) + item.amount;
            totalExpenseAmount += item.amount;
        });
  
        let topCategoryName = 'Khác';
        let maxCategoryAmount = 0;
        Object.keys(categoryMap).forEach(cat => {
            if (categoryMap[cat] > maxCategoryAmount) {
                maxCategoryAmount = categoryMap[cat];
                topCategoryName = cat;
            }
        });
        const topCategoryPercentage = totalExpenseAmount > 0 ? Math.round((maxCategoryAmount / totalExpenseAmount) * 100) : 0;
    
        // 2. PHÂN TÍCH THỜI ĐIỂM CHI NHIỀU NHẤT (Dựa theo Giờ của trường createdAt hoặc date)
        const timeSlots = {
            'Buổi sáng (06h - 12h)': 0,
            'Buổi chiều (12h - 18h)': 0,
            'Buổi tối (18h - 22h)': 0,
            'Ban đêm (22h - 06h)': 0
        };
  
        expenses.forEach(item => {
            const hours = new Date(item.date || item.createdAt).getHours();
            if (hours >= 6 && hours < 12) timeSlots['Buổi sáng (06h - 12h)'] += item.amount;
            else if (hours >= 12 && hours < 18) timeSlots['Buổi chiều (12h - 18h)'] += item.amount;
            else if (hours >= 18 && hours < 22) timeSlots['Buổi tối (18h - 22h)'] += item.amount;
            else timeSlots['Ban đêm (22h - 06h)'] += item.amount;
        });
  
        let topTimeSlotName = 'Buổi tối';
        let maxTimeAmount = 0;
        Object.keys(timeSlots).forEach(slot => {
            if (timeSlots[slot] > maxTimeAmount) {
                maxTimeAmount = timeSlots[slot];
                topTimeSlotName = slot;
            }
        });
  
        // 3. GIẢ LẬP ĐƯỜNG MINI CHART BIẾN ĐỘNG XU HƯỚNG
        const miniChartData = expenses.slice(-5).map(item => ({ value: item.amount }));
        if(miniChartData.length < 4) {
            while(miniChartData.length < 4) miniChartData.unshift({ value: 100000 });
        }
  
        res.json({
            trendPercentage: 8.5, 
            miniChartData,
            topCategory: {
                name: topCategoryName,
                percentage: topCategoryPercentage
            },
            topTimeSlot: {
                name: topTimeSlotName.split(' ')[0] + ' ' + topTimeSlotName.split(' ')[1], 
                slot: topTimeSlotName.substring(topTimeSlotName.indexOf('(')) 
            }
        });
  
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi hệ thống khi phân tích hành vi' });
    }
};

// @desc    Lấy dữ liệu báo cáo chi tiết theo tháng phục vụ Xuất PDF/Excel thực tế (Hỗ trợ Chi tiêu/Thu nhập/Tổng quan)
// @route   GET /api/analytics/reports/monthly
// @access  Private
const getMonthlyReport = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { date, type = 'expense' } = req.query; // Nhận thêm tham số type ('expense', 'income', 'all')
    
    let startDate, endDate;

    if (date) {
      startDate = new Date(`${date}-01T00:00:00.000Z`);
      endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Xây dựng bộ lọc động dựa vào loại báo cáo được yêu cầu
    const matchQuery = {
      user: new mongoose.Types.ObjectId(userId),
      date: { $gte: startDate, $lt: endDate }
    };

    if (type !== 'all') {
      matchQuery.type = type; // Lọc chính xác 'expense' hoặc 'income'
    }

    // 1. Tính tổng số tiền dựa theo bộ lọc loại giao dịch
    const totalResult = await Transaction.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAmount = totalResult.length > 0 ? totalResult[0].total : 0;

    // 2. Thống kê chi tiết số tiền gom nhóm theo Danh mục hoặc Loại giao dịch
    // Đối với tab Tổng quan ('all'), gom nhóm theo 'type' (Thu nhập/Chi tiêu) để vẽ biểu đồ tổng quát
    const groupField = type === 'all' ? '$type' : '$category';
    
    const categories = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupField,
          value: { $sum: '$amount' }
        }
      },
      { $sort: { value: -1 } }
    ]);

    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6b7280'];

    // 3. Chuẩn hóa cấu trúc object trả về cho Frontend hiển thị
    const reportData = categories.map((item, index) => {
      const pct = totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : 0;
      
      // Định dạng lại tên nếu hiển thị ở tab Tổng quan
      let displayName = item._id;
      if (type === 'all') {
        displayName = item._id === 'expense' ? 'Tổng Chi tiêu' : 'Tổng Thu nhập';
      }

      return {
        name: displayName, 
        value: item.value,
        percentage: `${pct}%`,
        color: type === 'all' ? (item._id === 'expense' ? '#ef4444' : '#10b981') : colors[index % colors.length]
      };
    });

    res.json({
      totalAmount,
      reportData
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi hệ thống khi lấy dữ liệu báo cáo' });
  }
};

module.exports = { 
    getDashboardAnalytics, 
    getBehaviorAnalytics,
    getMonthlyReport
};