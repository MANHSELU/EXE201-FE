# Smart Attendance System - Frontend

## 🎯 Tổng quan dự án

Hệ thống điểm danh thông minh sử dụng nhận diện khuôn mặt (Face Recognition) và mã QR, xây dựng trên **React + Vite + TypeScript + Tailwind CSS**.

### Tech Stack:
- **React 18** + **TypeScript**
- **Vite** (Fast build tool)
- **Tailwind CSS** (Styling)
- **React Router v7** (Navigation)
- **Axios** (API calls)
- **QR Code Generator** (react-qr-code)

---

## 📁 Cấu trúc dự án

```
my-app/
├── src/
│   ├── context/
│   │   └── AuthContext.tsx          # Quản lý authentication (login, logout, user state)
│   ├── services/
│   │   └── api.ts                   # Axios instance với interceptors (JWT token)
│   ├── pages/
│   │   ├── Login.tsx                # Trang đăng nhập chung
│   │   ├── student/
│   │   │   ├── Dashboard.tsx        # Dashboard sinh viên (thống kê điểm danh)
│   │   │   ├── Schedule.tsx         # Lịch học tuần (calendar view)
│   │   │   └── Attendance.tsx       # Trang điểm danh (camera + QR code input)
│   │   └── lecturer/
│   │       ├── Dashboard.tsx        # Dashboard giảng viên (overview, quick actions)
│   │       ├── Schedule.tsx         # Lịch dạy tuần (teaching schedule)
│   │       ├── GenerateAttendance.tsx # Tạo mã QR điểm danh
│   │       └── Statistics.tsx       # Thống kê chi tiết từng lớp
│   ├── App.tsx                      # Main app với routing + protected routes
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles + Tailwind imports
├── .env                              # Environment variables (API URL)
└── package.json
```

---

## 🚀 Cài đặt và chạy project

### 1. Install dependencies
```bash
npm install
```

### 2. Tạo file `.env` (đã có sẵn)
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Chạy development server
```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:5173**

### 4. Build production
```bash
npm run build
```

---

## 🔐 Authentication Flow

### Login:
1. User nhập email + password → `/api/login`
2. Backend trả về `{ token, user: { id, fullName, email, role } }`
3. Frontend lưu vào `localStorage` và redirect theo role:
   - **STUDENT** → `/student/dashboard`
   - **LECTURER** → `/lecturer/dashboard`

### Protected Routes:
- Sử dụng `ProtectedRoute` component check `user.role`
- Nếu chưa login hoặc sai role → redirect về `/login`

---

## 📱 Tính năng theo role

### **SINH VIÊN (Student)**

#### 1. **Dashboard** (`/student/dashboard`)
- Thống kê điểm danh theo môn học (circular progress bars)
- 4 môn: Vật Lý (9/10), Toán Học (8/10), Lập Trình (7/10), Tiếng Anh (10/10)
- Hướng dẫn điểm danh + lưu ý quan trọng

#### 2. **Lịch học** (`/student/schedule`)
- Calendar view theo tuần (Thứ 2 → Chủ Nhật)
- API: `GET /student/schedule/week` → lịch cố định hàng tuần
- API: `GET /student/slots/upcoming` → các buổi học sắp tới
- Highlight ngày hiện tại

#### 3. **Điểm danh** (`/student/attendance?slotId=xxx&sessionId=yyy`)
- **Input:** Mã QR 6 ký tự (A-Z, 0-9)
- **Camera:** Giả lập face recognition
- **API:** `POST /student/attendance/checkin`
  ```json
  {
    "slotId": "...",
    "attendanceSessionId": "...",
    "code": "A1B2C3",
    "faceImageUrl": "",
    "faceConfidence": 0.92
  }
  ```
- **Network Check:** Backend middleware kiểm tra IP (ALLOWED_IP_PREFIXES trong `.env`)

---

### **GIẢNG VIÊN (Lecturer)**

#### 1. **Dashboard** (`/lecturer/dashboard`)
- Overview: Total Classes, Avg Attendance (85% ↑ +2.4%)
- Upcoming Classes (3 sessions)
- Quick Action: Create Attendance Code button
- Recent Alerts (Low Attendance, Pending Approvals, System Update)

#### 2. **Teaching Schedule** (`/lecturer/schedule`)
- Calendar view theo tuần
- API: `GET /lecturer/schedule/week` → lịch dạy cố định
- API: `GET /lecturer/slots/upcoming` → slots sắp tới
- Hiển thị current class đang diễn ra (Happening Now banner)
- Button "Start Attendance" → redirect `/lecturer/attendance/generate`

#### 3. **Generate QR Code** (`/lecturer/attendance/generate`)
- **Select Class:** Dropdown chọn slot từ upcoming slots
- **Validity Duration:** 5/10/15 phút (hiện tại BE cố định 2 phút)
- **Generate Code:**
  ```json
  POST /lecturer/attendance/createQrCode
  { "slotId": "..." }
  
  Response:
  {
    "attendanceSessionId": "...",
    "slotId": "...",
    "code": "A1B2C3"  // 6 ký tự random
  }
  ```
- **Display:** 
  - Mã QR lớn (dùng react-qr-code)
  - Mã text 6 ký tự
  - Countdown timer (circular progress)
- **Actions:** Copy, Fullscreen, End session

#### 4. **Statistics** (`/lecturer/reports`)
- Chi tiết điểm danh từng lớp
- Stats cards: Total Students (45), Present Today (40), Absent (5), Avg (89%)
- Table: Student Name, ID, Arrival Time, Status (Present/Late/Absent), Attendance Rate
- Filter by date, search student
- Export to Excel

---

## 🔗 API Endpoints sử dụng

### **Common:**
- `POST /api/login` - Đăng nhập

### **Student:**
- `GET /api/student/schedule/week` - Lịch học tuần
- `GET /api/student/slots/upcoming` - Slots sắp tới
- `POST /api/student/attendance/checkin` - Điểm danh (có `networkCheck` middleware)

### **Lecturer:**
- `GET /api/lecturer/schedule/week` - Lịch dạy tuần
- `GET /api/lecturer/slots/upcoming` - Teaching slots
- `POST /api/lecturer/attendance/createQrCode` - Tạo mã QR (auto generate code + 2 phút expiry)

---

## 🎨 Design System

### Colors:
- **Primary:** Orange 500 (#f97316)
- **Success:** Green 500
- **Warning:** Yellow/Orange
- **Danger:** Red 500
- **Neutral:** Gray scale

### Typography:
- **Font:** Inter (Google Fonts)
- **Headings:** Bold (700-800)
- **Body:** Regular/Medium (400-500)

### Components:
- **Buttons:** Rounded-xl, shadow-lg on hover
- **Cards:** Rounded-2xl, border + shadow-sm
- **Icons:** Material Icons Outlined

---

## 📋 Test Accounts (từ BE seed data)

### Admin:
```
Email: admin@school.edu
Password: 123456
```

### Giảng viên:
```
Email: gv1@school.edu
Password: 123456
```

### Sinh viên:
```
Email: sv1@school.edu
Password: 123456
```

---

## 🔧 Lưu ý quan trọng

### 1. **Network Restriction (Student Check-in)**
- Backend có middleware `networkCheck` check IP prefix
- Cấu hình trong BE `.env`: `ALLOWED_IP_PREFIXES=192.168.,10.`
- Nếu không match → `403: "Bạn phải kết nối mạng trường để điểm danh"`

### 2. **QR Code Expiry**
- BE tự động set `startTime = now`, `endTime = now + 2 phút`
- Frontend hiển thị countdown
- Nếu hết hạn → student không thể check-in

### 3. **Face Recognition (Giả lập)**
- Frontend chỉ giả lập camera UI
- `faceConfidence` hiện tại hard-code (0.8-0.95)
- Trong thực tế cần tích hợp AI service (Face++ / AWS Rekognition / TensorFlow.js)

### 4. **Session Management**
- JWT token lưu trong `localStorage`
- Axios interceptor tự động thêm `Authorization: Bearer <token>` vào mọi request
- Nếu 401 → auto logout + redirect `/login`

---

## 🐛 Debugging

### Nếu gặp lỗi CORS:
- Check BE có `cors()` middleware chưa
- Thêm trong `app.js`:
  ```js
  const cors = require('cors');
  app.use(cors({ origin: 'http://localhost:5173' }));
  ```

### Nếu API không hoạt động:
- Check `.env` file: `VITE_API_URL=http://localhost:3000/api`
- Restart dev server: `npm run dev`
- Check BE server đang chạy: `http://localhost:3000`

---

## 📦 Packages chính

```json
{
  "react": "^18.2.0",
  "react-router-dom": "^7.12.0",
  "axios": "^1.13.2",
  "react-qr-code": "^2.0.18",
  "tailwindcss": "^4.1.18"
}
```

---

## 🚀 Gợi ý trang bổ sung (chưa implement)

1. **Profile/Settings** - Cập nhật thông tin, đổi mật khẩu, upload ảnh khuôn mặt
2. **Attendance History (Student)** - Lịch sử điểm danh chi tiết
3. **Class Detail (Lecturer)** - Quản lý sinh viên, export report
4. **Notifications** - Thông báo lịch học, deadline
5. **Admin Panel** - Quản lý user, class, schedule (role ADMIN)

---

## 📞 Support

Nếu gặp vấn đề, check:
- Terminal console (FE)
- Browser DevTools → Network tab
- BE server logs

---

**Happy Coding! 🎉**
