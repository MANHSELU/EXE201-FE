import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/Footer";
import StudentHeader from "../../components/StudentHeader";

interface AttendanceStats {
  subject: string;
  present: number;
  total: number;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats] = useState<AttendanceStats[]>([
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
        <StudentHeader />

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
