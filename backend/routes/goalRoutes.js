const express = require('express');
const router = express.Router();
const { getGoals, createGoal, updateGoalAmount, updateGoalDetails, deleteGoal } = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getGoals)
  .post(protect, createGoal);

router.route('/:id')
  .put(protect, updateGoalAmount)
  .patch(protect, updateGoalDetails)
  .delete(protect, deleteGoal);

module.exports = router;
