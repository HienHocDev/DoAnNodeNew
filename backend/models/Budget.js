const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  month: {
    type: String, // format 'YYYY-MM'
    required: true,
  }
}, {
  timestamps: true,
});

// Đảm bảo dòng này export đúng tên 'Budget' và biến 'budgetSchema' (viết hoa viết thường phải chuẩn)
module.exports = mongoose.model('Budget', budgetSchema);