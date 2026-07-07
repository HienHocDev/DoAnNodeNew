const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const { sendReminderEmail } = require('../services/emailService');

// Schedule tasks to be run on the server.
// For testing purposes, we can run this every minute: '* * * * *'
// For production, we can run this every day at 08:00 AM: '0 8 * * *'
const startReminderCronJob = () => {
  console.log("Starting Reminder Cron Job (Runs every day at 08:00 AM)...");

  cron.schedule('0 8 * * *', async () => {
    console.log("Running Daily Reminder Check...");
    try {
      // Get current date and date 3 days from now
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);
      threeDaysLater.setHours(23, 59, 59, 999);

      // Find uncompleted reminders due within the next 3 days
      const dueReminders = await Reminder.find({
        isCompleted: false,
        dueDate: {
          $gte: today,
          $lte: threeDaysLater
        }
      }).populate('user', 'name email');

      console.log(`Found ${dueReminders.length} reminder(s) due soon.`);

      for (const reminder of dueReminders) {
        if (reminder.user && reminder.user.email) {
          const subject = `[Finance Tracker] Nhắc nhở hóa đơn sắp đến hạn: ${reminder.title}`;
          const text = `Chào ${reminder.user.name},\n\nHóa đơn "${reminder.title}" (Số tiền: ${reminder.amount.toLocaleString()} VNĐ) của bạn sắp đến hạn vào ngày ${new Date(reminder.dueDate).toLocaleDateString('vi-VN')}.\n\nVui lòng đăng nhập vào ứng dụng và kiểm tra/thanh toán để tránh quá hạn nhé!\n\nTrân trọng,\nFinance Tracker Team`;
          
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <h2 style="color: #16a34a;">Nhắc nhở hóa đơn sắp đến hạn</h2>
              <p>Chào <strong>${reminder.user.name}</strong>,</p>
              <p>Hóa đơn <strong>"${reminder.title}"</strong> của bạn sắp đến hạn thanh toán.</p>
              <ul>
                <li><strong>Số tiền:</strong> ${reminder.amount.toLocaleString()} VNĐ</li>
                <li><strong>Ngày đến hạn:</strong> ${new Date(reminder.dueDate).toLocaleDateString('vi-VN')}</li>
              </ul>
              <p>Vui lòng đăng nhập vào Finance Tracker và đánh dấu hoàn thành sau khi bạn đã thanh toán nhé!</p>
              <br/>
              <p>Trân trọng,<br/><strong>Finance Tracker Team</strong></p>
            </div>
          `;

          await sendReminderEmail(reminder.user.email, subject, text, html);
        }
      }
    } catch (error) {
      console.error("Error in reminder cron job:", error);
    }
  });
};

module.exports = startReminderCronJob;
