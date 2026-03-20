import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Footer from "../../components/Footer";
import StudentHeader from "../../components/StudentHeader";

interface Semester {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface SubjectReport {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  totalSlotsInSemester: number;
  takenSlots: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  allowedAbsent: number;
}

// Câu động viên dành cho sinh viên (giống kiểu trang giảng viên)
const studentMotivationalQuotes = [
  { quote: "Mỗi buổi học đều là cơ hội để bạn tiến gần hơn đến mục tiêu! 🌱", author: "NCT EDU" },
  { quote: "Điểm danh đầy đủ là bước đầu tiên để chinh phục môn học! ✨", author: "NCT EDU" },
  { quote: "Hôm nay bạn đến lớp là đã chiến thắng chính mình rồi! 🌟", author: "NCT EDU" },
  { quote: "Sự chăm chỉ của bạn hôm nay sẽ trả về thành quả ngày mai! 🚀", author: "NCT EDU" },
  { quote: "Mỗi buổi có mặt là bạn đang đầu tư cho tương lai của mình! 📖", author: "NCT EDU" },
  { quote: "Cố lên! Chỉ còn vài buổi nữa là hoàn thành kì học! ☀️", author: "NCT EDU" },
  { quote: "Đừng bỏ lỡ buổi nào — mỗi tiết học đều quan trọng! 💪", author: "NCT EDU" },
  { quote: "Đi học đều giúp bạn tự tin và nắm vững kiến thức! 🌍", author: "NCT EDU" },
  { quote: "Bạn làm được! Hãy giữ vững phong độ điểm danh nhé! 💡", author: "NCT EDU" },
  { quote: "Sinh viên chăm chỉ hôm nay là chuyên gia tài năng ngày mai! 🎯", author: "NCT EDU" },
];

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [bySubject, setBySubject] = useState<SubjectReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [currentQuote] = useState(
    () => studentMotivationalQuotes[Math.floor(Math.random() * studentMotivationalQuotes.length)]
  );

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await api.get("/student/semesters");
        const list = res.data.data || [];
        setSemesters(list);
        if (list.length > 0 && !selectedSemesterId) setSelectedSemesterId(list[0]._id);
      } catch {
        setSemesters([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (!selectedSemesterId) {
      setBySubject([]);
      return;
    }
    const fetchReport = async () => {
      setLoadingReport(true);
      try {
        const res = await api.get(`/student/attendance/report-by-semester?semesterId=${selectedSemesterId}`);
        const data = res.data.data;
        setBySubject(data?.bySubject ?? []);
      } catch {
        setBySubject([]);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchReport();
  }, [selectedSemesterId]);

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

      <style>{`
        /* Motivation card - giống trang giảng viên (người chạy + hiệu ứng) */
        .student-motivation-card {
          background: linear-gradient(135deg, #FF7043 0%, #FFAB91 100%);
          border-radius: 16px;
          padding: 1rem 1.25rem;
          position: relative;
          overflow: visible;
          box-shadow: 0 4px 15px rgba(255, 112, 67, 0.25);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .student-motivation-card::before {
          content: '';
          position: absolute;
          top: -30px;
          right: -30px;
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.15);
          border-radius: 50%;
        }
        .student-motivation-card::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: -20px;
          width: 60px;
          height: 60px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
        }
        .student-running-mascot {
          flex-shrink: 0;
          width: 55px;
          height: 55px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .student-mascot-body {
          position: relative;
          animation: student-run-bounce 0.25s ease-in-out infinite;
        }
        .student-mascot-emoji {
          font-size: 38px;
          display: block;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2));
        }
        @keyframes student-run-bounce {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-5px) rotate(3deg); }
        }
        .student-mascot-legs {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
        }
        .student-mascot-leg {
          width: 6px;
          height: 12px;
          background: linear-gradient(to bottom, #FFB74D, #FF9800);
          border-radius: 3px;
          transform-origin: top center;
        }
        .student-mascot-leg-left { animation: student-leg-left 0.12s ease-in-out infinite; }
        .student-mascot-leg-right { animation: student-leg-right 0.12s ease-in-out infinite; }
        @keyframes student-leg-left {
          0%, 100% { transform: rotate(25deg); }
          50% { transform: rotate(-25deg); }
        }
        @keyframes student-leg-right {
          0%, 100% { transform: rotate(-25deg); }
          50% { transform: rotate(25deg); }
        }
        .student-floating-reactions {
          position: absolute;
          top: -10px;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: visible;
        }
        .student-reaction {
          position: absolute;
          font-size: 12px;
          animation: student-float-reaction 2s ease-out infinite;
          opacity: 0;
        }
        .student-reaction:nth-child(1) { left: 10%; animation-delay: 0s; }
        .student-reaction:nth-child(2) { left: 25%; animation-delay: 0.4s; }
        .student-reaction:nth-child(3) { left: 45%; animation-delay: 0.8s; }
        .student-reaction:nth-child(4) { left: 65%; animation-delay: 1.2s; }
        .student-reaction:nth-child(5) { left: 80%; animation-delay: 1.6s; }
        @keyframes student-float-reaction {
          0% { opacity: 0; transform: translateY(30px) scale(0.5); }
          20% { opacity: 1; transform: translateY(15px) scale(1); }
          100% { opacity: 0; transform: translateY(-25px) scale(0.8); }
        }
        .student-run-dust {
          position: absolute;
          left: -8px;
          bottom: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .student-dust {
          width: 8px;
          height: 8px;
          background: rgba(255,255,255,0.6);
          border-radius: 50%;
          animation: student-dust-puff 0.4s ease-out infinite;
        }
        .student-dust:nth-child(2) { animation-delay: 0.1s; width: 6px; height: 6px; }
        .student-dust:nth-child(3) { animation-delay: 0.2s; width: 4px; height: 4px; }
        @keyframes student-dust-puff {
          0% { opacity: 0.8; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(-15px) scale(0.3); }
        }
        .student-motivation-text { flex: 1; min-width: 0; }
        .student-quote-inline {
          font-size: 13px;
          font-weight: 600;
          color: white;
          line-height: 1.45;
          text-shadow: 0 1px 2px rgba(0,0,0,0.15);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          animation: student-text-glow 2s ease-in-out infinite;
        }
        @keyframes student-text-glow {
          0%, 100% { opacity: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.15); }
          50% { opacity: 0.85; text-shadow: 0 0 8px rgba(255,255,255,0.8), 0 0 15px rgba(255,255,255,0.5); }
        }
      `}</style>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Attendance Progress by Semester */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 min-h-0">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="text-xl font-bold text-gray-800">Tiến độ điểm danh theo kì</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSemesterId}
                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn kì --</option>
                    {semesters.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading || loadingReport ? (
                <div className="flex items-center justify-center py-12 text-gray-500">Đang tải...</div>
              ) : bySubject.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  Chưa có môn nào trong kì này hoặc chưa có dữ liệu điểm danh.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                    {bySubject.map((item) => {
                      const total = item.takenSlots || 0;
                      const present = item.presentCount;
                      const pct = total > 0 ? (present / total) * 351.86 : 0;
                      const isOverLimit = item.allowedAbsent > 0 && item.absentCount >= item.allowedAbsent;
                      return (
                        <div
                          key={item.subjectId}
                          className="flex flex-col items-center justify-center min-h-[180px] p-3 rounded-xl border border-gray-100 bg-gray-50/50"
                        >
                          <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#e5e7eb"
                                strokeWidth="12"
                                fill="none"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke={isOverLimit ? "#ef4444" : "#f97316"}
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${pct} 351.86`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-xl sm:text-2xl font-bold tabular-nums ${isOverLimit ? "text-red-600" : "text-gray-800"}`}>
                                {present}/{total}
                              </span>
                            </div>
                          </div>
                          <h3 className="font-semibold text-gray-800 mt-3 text-sm text-center line-clamp-2 leading-tight">
                            {item.subjectName}
                          </h3>
                          <p className="mt-1.5 text-xs text-gray-600 text-center">
                            Bạn đã nghỉ <span className="font-semibold">{item.absentCount ?? 0}</span> trên <span className="font-semibold">{total}</span> buổi học.
                          </p>
                        </div>
                      );
                    })}
                  </div>

                </>
              )}
            </div>

            {/* Quick Actions Sidebar - cùng chiều cao với ô tiến độ điểm danh */}
            <div className="flex flex-col gap-6 min-h-0">
              {/* Câu động viên - kích thước tự nhiên */}
              <div className="student-motivation-card shrink-0">
                <div className="student-floating-reactions">
                  <span className="student-reaction">💖</span>
                  <span className="student-reaction">👍</span>
                  <span className="student-reaction">💗</span>
                  <span className="student-reaction">❤️</span>
                  <span className="student-reaction">💕</span>
                </div>
                <div className="student-running-mascot">
                  <div className="student-run-dust">
                    <div className="student-dust" />
                    <div className="student-dust" />
                    <div className="student-dust" />
                  </div>
                  <div className="student-mascot-body">
                    <span className="student-mascot-emoji" aria-hidden>🏃</span>
                    <div className="student-mascot-legs">
                      <div className="student-mascot-leg student-mascot-leg-left" />
                      <div className="student-mascot-leg student-mascot-leg-right" />
                    </div>
                  </div>
                </div>
                <div className="student-motivation-text">
                  <p className="student-quote-inline">{currentQuote.quote}</p>
                  <p className="mt-1.5 text-xs font-medium text-white/90">{currentQuote.author}</p>
                </div>
              </div>

              {/* Cảnh báo điểm danh - phía dưới câu nói, giãn chiều cao bằng ô tiến độ */}
              {(() => {
                const hasWarning = bySubject.some((s) => s.allowedAbsent > 0 && s.absentCount >= s.allowedAbsent);
                const showWarning = selectedSemesterId && !loadingReport && bySubject.length > 0 && hasWarning;
                const showOk = selectedSemesterId && !loadingReport && bySubject.length > 0 && !hasWarning;
                return (
                  <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div
                      className={`h-1 w-full shrink-0 ${
                        showWarning ? "bg-red-400" : showOk ? "bg-emerald-400" : "bg-gray-200"
                      }`}
                    />
                    <div className="flex-1 min-h-0 flex flex-col justify-center p-5">
                      <div className="flex items-start gap-4">
                        <span
                          className={`material-icons-outlined shrink-0 text-2xl ${
                            showWarning ? "text-red-500" : showOk ? "text-emerald-500" : "text-gray-400"
                          }`}
                        >
                          {showWarning ? "notifications_active" : showOk ? "check_circle_outline" : "info"}
                        </span>
                        <div className="min-w-0 flex-1 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            {showWarning ? "Bạn đã nghỉ quá nhiều ở một số môn. Xem báo cáo để biết chi tiết." : "Cảnh báo điểm danh"}
                          </p>
                          {!selectedSemesterId && (
                            <p className="text-sm text-gray-600 leading-relaxed">Chọn kì học ở trên để xem cảnh báo.</p>
                          )}
                          {selectedSemesterId && loadingReport && (
                            <p className="text-sm text-gray-500 leading-relaxed">Đang tải...</p>
                          )}
                          {selectedSemesterId && !loadingReport && bySubject.length === 0 && (
                            <p className="text-sm text-gray-500 leading-relaxed">Chưa có dữ liệu cho kì này.</p>
                          )}
                          {showWarning && (
                            <>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                Bạn đã nghỉ quá số buổi cho phép ở một số môn. Xem báo cáo để biết chi tiết.
                              </p>
                              <a
                                href="/student/report"
                                className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-red-600 hover:text-red-700"
                              >
                                Xem báo cáo
                                <span className="material-icons-outlined text-base">arrow_forward</span>
                              </a>
                            </>
                          )}
                          {showOk && (
                            <>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                Bạn đang duy trì tốt. Tiếp tục đi học đều nhé!
                              </p>
                              <a
                                href="/student/report"
                                className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                              >
                                Xem báo cáo
                                <span className="material-icons-outlined text-base">arrow_forward</span>
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
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
