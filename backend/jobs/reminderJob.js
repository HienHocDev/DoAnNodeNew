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
      // Lấy thời điểm bắt đầu và kết thúc của ngày mai (1 ngày trước hạn chót)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrowStart = new Date(today);
      tomorrowStart.setDate(today.getDate() + 1);

      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // Tìm các nhắc nhở chưa hoàn thành và có hạn chót nằm trong ngày mai
      const dueReminders = await Reminder.find({
        isCompleted: false,
        dueDate: {
          $gte: tomorrowStart,
          $lte: tomorrowEnd
        }
      }).populate('user', 'name email');

      console.log(`Found ${dueReminders.length} reminder(s) due soon.`);

      for (const reminder of dueReminders) {
        if (reminder.user && reminder.user.email) {
          const subject = `[Finance Tracker] Nhắc nhở hóa đơn sắp đến hạn: ${reminder.title}`;
          const text = `Chào ${reminder.user.name},\n\nHóa đơn "${reminder.title}" (Số tiền: ${reminder.amount.toLocaleString()} VNĐ) của bạn sắp đến hạn vào ngày ${new Date(reminder.dueDate).toLocaleDateString('vi-VN')}.\n\nVui lòng đăng nhập vào ứng dụng và kiểm tra/thanh toán để tránh quá hạn nhé!\n\nTrân trọng,\nFinance Tracker Team`;
          
          const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px; color: #374151;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #10b981; margin: 0; font-size: 28px;">Finance Tracker</h1>
                <p style="color: #6b7280; font-size: 16px; margin-top: 4px;">Quản lý tài chính thông minh</p>
              </div>
              <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-top: 4px solid #f59e0b;">
                <h2 style="color: #d97706; font-size: 20px; margin-top: 0; margin-bottom: 16px;">Sắp Đến Hạn Thanh Toán! ⏰</h2>
                <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">Xin chào <strong>${reminder.user.name}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">Nhắc nhở <strong>"${reminder.title}"</strong> của bạn sẽ đến hạn vào ngày mai. Vui lòng sắp xếp thanh toán để tránh quá hạn nhé.</p>
                
                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                  <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Tiêu đề:</strong> <span style="color: #111827;">${reminder.title}</span></p>
                  <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Số tiền:</strong> <span style="color: #ef4444; font-weight: bold;">${reminder.amount.toLocaleString()} VNĐ</span></p>
                  <p style="margin: 0; font-size: 15px;"><strong>Ngày đến hạn:</strong> <span style="color: #111827;">${new Date(reminder.dueDate).toLocaleDateString('vi-VN')}</span></p>
                </div>
                
                <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">Hãy đăng nhập vào Finance Tracker và đánh dấu hoàn thành sau khi bạn đã xử lý xong!</p>
              </div>
              <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 14px;">
                <p style="margin: 0;">Trân trọng,</p>
                <p style="margin: 4px 0 0 0;"><strong>Đội ngũ Finance Tracker</strong></p>
              </div>
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
