const mongoose = require('mongoose');

const progressHistorySchema = new mongoose.Schema({
  amountAdded: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAfterUpdate: {
    type: Number,
    min: 0,
  },
  note: {
    type: String,
    trim: true,
    maxlength: 120,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, {
  _id: false,
});

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true, // Ví dụ: "Mua xe máy", "Tiền tiết kiệm"
  },
  targetAmount: {
    type: Number,
    required: true,
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  deadline: {
    type: Date,
    required: true,
  },
  progressHistory: {
    type: [progressHistorySchema],
    default: [],
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Goal', goalSchema);
