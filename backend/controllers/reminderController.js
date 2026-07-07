const Reminder = require('../models/Reminder');

// @desc    Get user reminders
// @route   GET /api/reminders
// @access  Private
const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id }).sort({ dueDate: 1 });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a reminder
// @route   POST /api/reminders
// @access  Private
const createReminder = async (req, res) => {
  try {
    const { title, amount, dueDate } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Vui lòng nhập tiêu đề và ngày nhắc nhở' });
    }

    const reminder = await Reminder.create({
      user: req.user._id,
      title,
      amount: amount || 0,
      dueDate
    });

    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a reminder
// @route   PUT /api/reminders/:id
// @access  Private
const updateReminder = async (req, res) => {
  try {
    const { title, amount, dueDate, isCompleted } = req.body;
    
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });
    if (!reminder) {
      return res.status(404).json({ message: 'Không tìm thấy nhắc nhở' });
    }

    if (title) reminder.title = title;
    if (amount !== undefined) reminder.amount = amount;
    if (dueDate) reminder.dueDate = dueDate;
    if (isCompleted !== undefined) reminder.isCompleted = isCompleted;

    const updatedReminder = await reminder.save();
    res.json(updatedReminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });
    if (!reminder) {
      return res.status(404).json({ message: 'Không tìm thấy nhắc nhở' });
    }

    await reminder.deleteOne();
    res.json({ message: 'Đã xóa nhắc nhở thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder
};
