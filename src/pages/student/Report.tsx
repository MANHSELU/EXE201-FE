import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/Footer";
import StudentHeader from "../../components/StudentHeader";

const StudentReport: React.FC = () => {
  useAuth();
  const [filter, setFilter] = useState("all");

  const records = [
    {
      date: "2023-10-26",
      subject: "Cơ Sở Dữ Liệu",
      code: "DS302",
      time: "08:05",
      status: "PRESENT",
      confidence: 92,
    },
    {
      date: "2023-10-25",
      subject: "Lập Trình Web",
      code: "IT404",
      time: "13:02",
      status: "PRESENT",
      confidence: 88,
    },
    {
      date: "2023-10-24",
      subject: "Toán Học",
      code: "MATH201",
      time: "--:--",
      status: "ABSENT",
      confidence: 0,
    },
  ];

  const stats = {
    total: 30,
    present: 27,
    absent: 2,
    late: 1,
    rate: 90,
  };

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

        {/* Main */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Báo Cáo Điểm Danh</h1>
            <p className="text-gray-500">Xem chi tiết lịch sử và thống kê điểm danh của bạn</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
              <span className="material-icons-outlined text-blue-500 text-4xl mb-2">calendar_today</span>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-500">Tổng buổi học</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
              <span className="material-icons-outlined text-green-500 text-4xl mb-2">check_circle</span>
              <p className="text-2xl font-bold text-gray-800">{stats.present}</p>
              <p className="text-sm text-gray-500">Có mặt</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
              <span className="material-icons-outlined text-red-500 text-4xl mb-2">cancel</span>
              <p className="text-2xl font-bold text-gray-800">{stats.absent}</p>
              <p className="text-sm text-gray-500">Vắng</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
              <span className="material-icons-outlined text-yellow-500 text-4xl mb-2">schedule</span>
              <p className="text-2xl font-bold text-gray-800">{stats.late}</p>
              <p className="text-sm text-gray-500">Trễ</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-center text-white">
              <p className="text-sm uppercase tracking-wide mb-1">Tỷ lệ</p>
              <p className="text-4xl font-bold">{stats.rate}%</p>
              <p className="text-xs opacity-90">Điểm danh</p>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-xl font-semibold ${
                    filter === "all"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilter("present")}
                  className={`px-4 py-2 rounded-xl font-semibold ${
                    filter === "present"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Có mặt
                </button>
                <button
                  onClick={() => setFilter("absent")}
                  className={`px-4 py-2 rounded-xl font-semibold ${
                    filter === "absent"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Vắng
                </button>
              </div>

              <input
                type="month"
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Ngày</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Môn học</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Giờ điểm danh</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Độ tin cậy</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(record.date).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">{record.subject}</p>
                        <p className="text-xs text-gray-500">{record.code}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{record.time}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            record.status === "PRESENT"
                              ? "bg-green-100 text-green-700"
                              : record.status === "LATE"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {record.status === "PRESENT" ? "Có mặt" : record.status === "LATE" ? "Trễ" : "Vắng"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {record.confidence > 0 ? `${record.confidence}%` : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default StudentReport;
