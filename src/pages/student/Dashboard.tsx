import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Footer from "../../components/Footer";

interface AttendanceStats {
  subject: string;
  present: number;
  total: number;
}

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AttendanceStats[]>([
    { subject: "Vật Lý", present: 9, total: 10 },
    { subject: "Toán Học", present: 8, total: 10 },
    { subject: "Lập Trình", present: 7, total: 10 },
    { subject: "Tiếng Anh", present: 10, total: 10 },
  ]);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
        rel="stylesheet"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="material-icons-outlined text-white">school</span>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <a
                  href="/student/dashboard"
                  className="flex items-center space-x-2 text-orange-500 border-b-2 border-orange-500 py-5"
                >
                  <span className="material-icons-outlined text-[20px]">home</span>
                  <span className="font-medium">Trang chủ</span>
                </a>
                <a
                  href="/student/schedule"
                  className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
                >
                  <span className="material-icons-outlined text-[20px]">calendar_today</span>
                  <span className="font-medium">Lịch học</span>
                </a>
                <a
                  href="/student/report"
                  className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
                >
                  <span className="material-icons-outlined text-[20px]">assignment_turned_in</span>
                  <span className="font-medium">Báo cáo</span>
                </a>
                <a
                  href="#"
                  className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
                >
                  <span className="material-icons-outlined text-[20px]">notifications</span>
                  <span className="font-medium">Thông báo</span>
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-semibold">{user?.fullName || "Nguyễn Văn A"}</p>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">
                    {user?.role || "Sinh viên"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {user?.fullName?.charAt(0) || "N"}
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-icons-outlined">logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-2xl p-8 mb-8 border border-orange-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Xin chào, {user?.fullName || "Nguyễn Văn A"}!
            </h1>
            <p className="text-gray-600">
              Chào mừng bạn đến với Hệ thống điểm danh thông minh. Hãy cùng trải nghiệm nhé!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Attendance Progress */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Tiến độ điểm danh tuần này</h2>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <span className="material-icons-outlined text-orange-500">assignment</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((item, idx) => (
                  <div key={idx} className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#f3f4f6"
                          strokeWidth="12"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#f97316"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${(item.present / item.total) * 351.86} 351.86`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute">
                        <div className="text-3xl font-bold text-gray-800">
                          {item.present}/{item.total}
                        </div>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-800 mt-3">{item.subject}</h3>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center space-x-2 text-sm text-red-600">
                <span className="material-icons-outlined text-lg">error_outline</span>
                <span className="font-medium">Giải thích: Sắp hết lượt nghỉ</span>
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              {/* Quick Check-in */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="material-icons-outlined text-orange-500">calendar_today</span>
                  <h3 className="font-bold text-gray-800">Lịch học nhanh</h3>
                </div>
                <a
                  href="/student/schedule"
                  className="block w-full text-center bg-orange-50 text-orange-600 font-semibold py-3 rounded-xl hover:bg-orange-100 transition"
                >
                  Xem lịch học
                </a>
              </div>

              {/* Reports */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="material-icons-outlined text-orange-500">bar_chart</span>
                  <h3 className="font-bold text-gray-800">Báo cáo mới nhất</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Xem chi tiết điểm danh của bạn</p>
                <a
                  href="/student/report"
                  className="block w-full text-center border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  Xem báo cáo
                </a>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Hướng dẫn điểm danh</h3>
              <div className="space-y-3">
                {[
                  "Truy cập đúng link hoặc mã QR của lớp học.",
                  "Xác nhận thông tin cá nhân và vị trí hiện tại.",
                  "Hệ thống sẽ ghi nhận nếu bạn ở trong khu vực quy định.",
                  "Kiểm tra lại trạng thái điểm danh trong lịch sử.",
                ].map((text, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-gray-600 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Lưu ý quan trọng</h3>
              <div className="space-y-3">
                {[
                  "Luôn bật định vị khi thực hiện điểm danh.",
                  "Điểm danh trong khoảng 15 phút đầu giờ học.",
                  "Hệ thống tự động trừ điểm nếu nghỉ quá số buổi quy định.",
                  "Liên hệ phòng đào tạo nếu gặp sự cố kỹ thuật.",
                ].map((text, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <span className="material-icons-outlined text-orange-500 text-xl">check_circle</span>
                    <p className="text-gray-600 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default StudentDashboard;
