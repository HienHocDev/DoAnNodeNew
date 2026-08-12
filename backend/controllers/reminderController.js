const Reminder = require('../models/Reminder');
const { sendReminderEmail } = require('../services/emailService');

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

    // Send email notification
    if (req.user && req.user.email) {
      const formattedDate = new Date(dueDate).toLocaleDateString('vi-VN');
      const formattedAmount = amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) : '0 ₫';
      const subject = `[Finance Tracker] Bạn có một nhắc nhở mới: ${title}`;
      const text = `Xin chào ${req.user.name},\n\nBạn đã tạo thành công một nhắc nhở mới.\n\nChi tiết nhắc nhở:\n- Tiêu đề: ${title}\n- Số tiền: ${formattedAmount}\n- Ngày đến hạn: ${formattedDate}\n\nChúc bạn quản lý tài chính hiệu quả!\n\nTrân trọng,\nĐội ngũ Finance Tracker`;
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px; color: #374151;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #10b981; margin: 0; font-size: 28px;">Finance Tracker</h1>
            <p style="color: #6b7280; font-size: 16px; margin-top: 4px;">Quản lý tài chính thông minh</p>
          </div>
          <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            <h2 style="color: #111827; font-size: 20px; margin-top: 0; margin-bottom: 16px;">Tạo Nhắc Nhở Thành Công!</h2>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">Xin chào <strong>${req.user.name}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">Bạn vừa thêm một nhắc nhở mới trên hệ thống. Dưới đây là chi tiết:</p>
            
            <div style="background-color: #f3f4f6; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Tiêu đề:</strong> <span style="color: #111827;">${title}</span></p>
              <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Số tiền:</strong> <span style="color: #ef4444; font-weight: bold;">${formattedAmount}</span></p>
              <p style="margin: 0; font-size: 15px;"><strong>Ngày đến hạn:</strong> <span style="color: #111827;">${formattedDate}</span></p>
            </div>
            
            <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">Chúc bạn một ngày tốt lành và quản lý chi tiêu hiệu quả!</p>
          </div>
          <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 14px;">
            <p style="margin: 0;">Trân trọng,</p>
            <p style="margin: 4px 0 0 0;"><strong>Đội ngũ Finance Tracker</strong></p>
          </div>
        </div>
      `;
      
      // We don't await this so it doesn't block the response
      sendReminderEmail(req.user.email, subject, text, html).catch(err => {
        console.error('Error in background email sending:', err);
      });
    }

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
