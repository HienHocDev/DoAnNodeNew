const express = require('express');
const router = express.Router();
const { 
  getDashboardAnalytics, 
  getBehaviorAnalytics, 
  getMonthlyReport 
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// 1. Route trang Tổng quan
router.get('/dashboard', protect, getDashboardAnalytics);

// 2. Route trang Phân tích hành vi
router.get('/analysis', protect, getBehaviorAnalytics);

// 3. Route trang Báo cáo (Dữ liệu thực tế cho PDF / Excel)
router.get('/reports/monthly', protect, getMonthlyReport);

module.exports = router;