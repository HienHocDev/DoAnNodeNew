# Finance Tracker Application

Đây là hệ thống quản lý tài chính cá nhân được thiết kế hiện đại, bao gồm cả Frontend (ReactJS) và Backend (Node.js/Express + MongoDB).

## Cấu trúc dự án

Dự án được chia làm 3 phần chính:
- `/frontend`: Giao diện người dùng xây dựng bằng ReactJS và TailwindCSS.
- `/backend`: Máy chủ API xây dựng bằng Node.js, Express và kết nối MongoDB.
- `/database`: Tài liệu thiết kế sơ đồ cơ sở dữ liệu (Schema Design).

## Yêu cầu môi trường

Để chạy được dự án này, máy tính của bạn cần cài đặt sẵn:
- **Node.js** (Phiên bản 16.x trở lên)
- **MongoDB** (Cài đặt cục bộ trên máy hoặc sử dụng MongoDB Atlas)

---

## Hướng dẫn cài đặt & Khởi chạy

### 1. Khởi chạy Backend (Máy chủ API)

Mở terminal (dòng lệnh) và làm theo các bước sau:

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt các thư viện cần thiết
npm install

# 3. Chạy server ở chế độ phát triển
npm run dev
```
*Lưu ý:* 
- Backend sẽ chạy ở cổng `http://localhost:5000`.
- Hãy đảm bảo bạn đã bật MongoDB trên máy trước khi chạy Backend để server kết nối thành công. Biến môi trường mặc định (xem trong file `.env`) đã được thiết lập để kết nối tới `mongodb://127.0.0.1:27017/finance_tracker`.

### 2. Khởi chạy Frontend (Giao diện người dùng)

Mở một terminal **mới** (giữ nguyên terminal của Backend đang chạy) và làm theo các bước sau:

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các thư viện cần thiết
npm install

# 3. Khởi chạy giao diện React
npm start
```
*Lưu ý:*
- Frontend sẽ chạy ở cổng `http://localhost:3000`.
- Trình duyệt sẽ tự động mở trang web khi lệnh chạy thành công.

---

## Các công nghệ sử dụng

**Frontend:**
- React.js (Create React App)
- Tailwind CSS v3 (UI Styling)
- React Router DOM (Điều hướng)
- Recharts (Vẽ biểu đồ)
- Lucide React (Bộ biểu tượng)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Token (JWT) & bcryptjs (Bảo mật, Xác thực)
