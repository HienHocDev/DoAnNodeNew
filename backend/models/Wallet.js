const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: 'Wallet', // lucide-react icon name string
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Wallet', walletSchema);
