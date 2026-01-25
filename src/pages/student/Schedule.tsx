import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Footer from "../../components/Footer";

interface Slot {
  _id: string;
  subjectId: {
    code: string;
    name: string;
  };
  classId: {
    name: string;
  };
  roomId: {
    name: string;
  };
  date: string;
  startTime: string;
  endTime: string;
}

interface Schedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectId: {
    code: string;
    name: string;
  };
  classId: {
    name: string;
  };
}

const StudentSchedule: React.FC = () => {
  const { user, logout } = useAuth();
  const [, setSlots] = useState<Slot[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const [slotsRes, schedulesRes] = await Promise.all([
        api.get("/student/slots/upcoming"),
        api.get("/student/schedule/week"),
      ]);

      setSlots(slotsRes.data.data || []);
      setSchedules(schedulesRes.data.data || []);
    } catch (err) {
      // Lỗi khi tải lịch học
    } finally {
      setLoading(false);
    }
  };

  const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const currentDay = new Date().getDay() || 7; // 0=CN -> 7

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
        rel="stylesheet"
      />

      <style>{`
        body { font-family: 'Inter', sans-serif; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
        .day-column { min-height: 600px; }
        .current-day-highlight {
          background: linear-gradient(180deg, rgba(249, 115, 22, 0.05) 0%, rgba(249, 115, 22, 0.02) 100%);
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 text-slate-900">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                <span className="material-icons-outlined">school</span>
              </div>

              <div className="flex items-center space-x-6">
                <a
                  href="/student/dashboard"
                  className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
                >
                  <span className="material-icons-outlined text-[20px]">home</span>
                  <span className="font-medium">Trang chủ</span>
                </a>
                <a
                  href="/student/schedule"
                  className="flex items-center space-x-2 text-orange-500 border-b-2 border-orange-500 py-5"
                >
                  <span className="material-icons-outlined text-[20px]">calendar_today</span>
                  <span className="font-medium">Lịch học</span>
                </a>
                <a
                  href="/student/report"
                  className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
                >
                  <span className="material-icons-outlined text-[20px]">assignment_turned_in</span>
                  <span className="font-medium">Báo cáo điểm danh</span>
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold">{user?.fullName}</p>
                <p className="text-[11px] text-gray-500 uppercase">SINH VIÊN</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {user?.fullName?.charAt(0)}
              </div>
              <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600">
                <span className="material-icons-outlined">logout</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-800">Lịch học học tập</h1>
              <p className="text-gray-500 mt-1">Quản lý thời gian và lộ trình học tập hiệu quả</p>
            </div>

            <div className="inline-flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              <button className="px-5 py-2 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-50 transition">
                Ngày
              </button>
              <button className="px-5 py-2 text-sm font-medium rounded-lg bg-orange-50 text-orange-500">
                Tuần
              </button>
              <button className="px-5 py-2 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-50 transition">
                Tháng
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <button className="p-2 hover:bg-white rounded-lg border border-gray-200 transition shadow-sm">
                <span className="material-icons-outlined text-gray-600">chevron_left</span>
              </button>
              <h2 className="text-lg font-bold text-orange-500 tracking-wide">Tháng 10 - 2023</h2>
              <button className="p-2 hover:bg-white rounded-lg border border-gray-200 transition shadow-sm">
                <span className="material-icons-outlined text-gray-600">chevron_right</span>
              </button>
            </div>

            <div className="calendar-grid">
              {/* Headers */}
              {[2, 3, 4, 5, 6, 7, 1].map((day, idx) => {
                const isToday = day === currentDay;
                return (
                  <div
                    key={idx}
                    className={`py-4 border-b ${idx < 6 ? "border-r" : ""} border-gray-200 text-center ${
                      isToday ? "bg-orange-50/50 ring-1 ring-inset ring-orange-500/20" : ""
                    }`}
                  >
                    <p
                      className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${
                        isToday ? "text-orange-500" : "text-gray-400"
                      }`}
                    >
                      {dayNames[day]}
                    </p>
                    <p
                      className={`text-xl font-semibold ${
                        isToday ? "text-orange-500 font-extrabold" : "text-gray-700"
                      }`}
                    >
                      {25 + idx}
                    </p>
                  </div>
                );
              })}

              {/* Day columns */}
              {[2, 3, 4, 5, 6, 7, 1].map((day, idx) => {
                const daySchedules = schedules.filter((s) => s.dayOfWeek === day);
                const isToday = day === currentDay;

                return (
                  <div
                    key={idx}
                    className={`day-column ${idx < 6 ? "border-r" : ""} border-gray-200 p-3 space-y-4 ${
                      isToday ? "current-day-highlight ring-1 ring-inset ring-orange-500/20" : ""
                    }`}
                  >
                    {daySchedules.map((schedule, sIdx) => (
                      <div
                        key={sIdx}
                        className={`group ${
                          isToday ? "bg-white border-2 border-orange-500/20" : "bg-gray-50 border border-gray-200"
                        } rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 relative`}
                      >
                        {isToday && (
                          <div className="absolute -left-0.5 top-6 bottom-6 w-1 bg-orange-500 rounded-full"></div>
                        )}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              isToday
                                ? "bg-orange-100 text-orange-500"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            [{schedule.subjectId.code.substring(0, 3)}]
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              isToday ? "text-orange-500" : "text-gray-500"
                            }`}
                          >
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm mb-3 leading-snug">
                          {schedule.subjectId.name}
                        </h3>
                        <div className="space-y-1.5">
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="material-icons-outlined text-[14px] mr-2">school</span>
                            {schedule.classId.name}
                          </div>
                        </div>
                        {isToday && (
                          <button className="mt-4 w-full py-2 bg-white border border-orange-200 rounded-lg text-xs font-semibold text-orange-500 flex items-center justify-center space-x-2 hover:bg-orange-50 transition">
                            <span className="material-icons-outlined text-[16px]">qr_code_scanner</span>
                            <span>Điểm danh</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <footer className="mt-12 text-center pb-8">
          <p className="text-sm text-gray-400">© 2023 Smart Attendance System. All rights reserved.</p>
        </footer>
      </div>
      <Footer />
    </>
  );
};

export default StudentSchedule;
