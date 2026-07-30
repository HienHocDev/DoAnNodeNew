const express = require('express');
const router = express.Router();
const {
  getBudgets, createBudget, updateBudget, deleteBudget
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

// Khai báo chuẩn cấu trúc router.route của người A
router.route('/')
  .get(protect, getBudgets)
  .post(protect, createBudget);

router.route('/:id')
  .patch(protect, updateBudget)
  .delete(protect, deleteBudget);

module.exports = router;
