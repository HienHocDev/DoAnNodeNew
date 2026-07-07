const Wallet = require('../models/Wallet');

// @desc    Get user wallets
// @route   GET /api/wallets
// @access  Private
const getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find({ user: req.user._id });
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new wallet
// @route   POST /api/wallets
// @access  Private
const createWallet = async (req, res) => {
  try {
    const { name, balance, icon, isDefault } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Vui lòng nhập tên ví' });
    }

    // If this is set to default, unset other default wallets for this user
    if (isDefault) {
      await Wallet.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const wallet = await Wallet.create({
      user: req.user._id,
      name,
      balance: balance || 0,
      icon,
      isDefault: isDefault || false
    });

    res.status(201).json(wallet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update wallet
// @route   PUT /api/wallets/:id
// @access  Private
const updateWallet = async (req, res) => {
  try {
    const { name, balance, icon, isDefault } = req.body;
    
    const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: 'Không tìm thấy ví' });
    }

    if (isDefault && !wallet.isDefault) {
      await Wallet.updateMany({ user: req.user._id }, { isDefault: false });
    }

    wallet.name = name || wallet.name;
    if (balance !== undefined) wallet.balance = balance;
    if (icon) wallet.icon = icon;
    if (isDefault !== undefined) wallet.isDefault = isDefault;

    const updatedWallet = await wallet.save();
    res.json(updatedWallet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a wallet
// @route   DELETE /api/wallets/:id
// @access  Private
const deleteWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: 'Không tìm thấy ví' });
    }

    await wallet.deleteOne();
    res.json({ message: 'Đã xóa ví thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWallets,
  createWallet,
  updateWallet,
  deleteWallet
};
