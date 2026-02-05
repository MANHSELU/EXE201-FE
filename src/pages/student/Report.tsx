import { useState, useEffect } from "react";
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
  firstDate: string | null;
  lastDate: string | null;
}

interface ReportBySemester {
  semester: { _id: string; name: string; startDate: string; endDate: string };
  bySubject: SubjectReport[];
}

const StudentReport: React.FC = () => {
  useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [report, setReport] = useState<ReportBySemester | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSemesters = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/student/semesters");
        const list = res.data.data || [];
        setSemesters(list);
        if (list.length > 0 && !selectedSemesterId) setSelectedSemesterId(list[0]._id);
      } catch (err: unknown) {
        setSemesters([]);
        const ax = err as { response?: { status?: number; data?: unknown }; message?: string };
        console.error("[Report] Lỗi tải danh sách kì học:", ax.response?.status, ax.response?.data ?? ax.message);
        if (ax.response?.status === 404) {
          setError("Chức năng báo cáo theo kì cần backend đã cập nhật. Vui lòng deploy lại backend (có route GET /api/student/semesters).");
        } else if (ax.response?.status === 500) {
          setError("Lỗi server khi tải kì học. Kiểm tra backend đã có model Semester và đã chạy seed (tạo kì + gán semesterId cho slot).");
        } else if (ax.response?.status === 401) {
          setError("Phiên đăng nhập hết hạn. Đang chuyển về trang đăng nhập...");
        } else {
          setError("Không tải được danh sách kì học. Kiểm tra backend đang chạy, đúng địa chỉ VITE_API_URL, hoặc đăng nhập lại.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (!selectedSemesterId) {
      setReport(null);
      return;
    }
    const fetchReport = async () => {
      setLoadingReport(true);
      setError("");
      try {
        const res = await api.get(`/student/attendance/report-by-semester?semesterId=${selectedSemesterId}`);
        setReport(res.data.data || null);
      } catch {
        setReport(null);
        setError("Không tải được báo cáo kì này.");
      } finally {
        setLoadingReport(false);
      }
    };
    fetchReport();
  }, [selectedSemesterId]);

  const bySubject = report?.bySubject ?? [];

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

      <div className="min-h-screen bg-[#FFF8F5]">
        <StudentHeader />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] mb-1">Báo Cáo Điểm Danh</h1>
            <p className="text-sm text-[#6B7280]">Xem báo cáo điểm danh theo kì học, từng môn</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-[#6B7280]">Đang tải danh sách kì...</p>
            </div>
          ) : error && !selectedSemesterId ? (
            <div className="bg-[#FFF7ED] border border-orange-200 rounded-xl p-4 text-orange-800">
              <p className="font-medium">{error}</p>
              <p className="mt-2 text-sm">Nếu bạn đã deploy backend mới (có model Semester và route GET /api/student/semesters), hãy kiểm tra console trình duyệt (F12) hoặc log server để xem lỗi chi tiết.</p>
            </div>
          ) : semesters.length === 0 && !loading && !error ? (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center text-[#6B7280] shadow-sm">
              <p className="font-medium text-[#374151]">Chưa có kì học nào</p>
              <p className="mt-1 text-sm">Bạn chưa được gán lớp hoặc chưa có lịch học trong kì nào. Liên hệ quản trị viên để được gán lớp và tạo lịch theo kì.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-5 sm:p-6 mb-6 flex flex-col sm:flex-row gap-6 items-stretch">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-[#374151] mb-1">Chọn kì học</label>
                  <p className="text-sm text-[#6B7280] mb-3">Chọn một kì để xem báo cáo điểm danh từng môn trong kì đó.</p>
                  <select
                    value={selectedSemesterId}
                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                    className="w-full max-w-md px-4 py-3 border border-[#E5E7EB] rounded-xl bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white"
                    aria-label="Chọn kì học"
                  >
                    <option value="">-- Chọn kì học --</option>
                    {semesters.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({new Date(s.startDate).toLocaleDateString("vi-VN")} – {new Date(s.endDate).toLocaleDateString("vi-VN")})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="w-full rounded-xl border border-[#E5E7EB] bg-gradient-to-br from-[#FFF7ED] to-white p-4 sm:p-5 flex items-start gap-3">
                    <span className="material-icons-outlined text-3xl text-orange-500 shrink-0" aria-hidden>assessment</span>
                    <div>
                      {loadingReport ? (
                        <p className="text-sm text-[#6B7280]">Đang tải báo cáo...</p>
                      ) : report && bySubject.length > 0 ? (
                        <>
                          <p className="text-sm font-semibold text-[#1F2937]">Kì này bạn có {bySubject.length} môn học</p>
                          <p className="text-xs text-[#6B7280] mt-0.5">Bảng báo cáo chi tiết theo từng môn nằm bên dưới. Xanh = tốt, vàng = cần cải thiện, đỏ = vượt giới hạn nghỉ.</p>
                        </>
                      ) : selectedSemesterId ? (
                        <p className="text-sm text-[#6B7280]">Chọn kì xong, báo cáo sẽ hiển thị bên dưới.</p>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-[#1F2937]">Mẹo nhỏ</p>
                          <p className="text-xs text-[#6B7280] mt-0.5">Điểm danh đủ buổi giúp bạn đạt môn an toàn. Mỗi môn được nghỉ tối đa 20% số buổi đã điểm danh.</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {loadingReport ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-[#6B7280]">Đang tải báo cáo...</p>
                </div>
              ) : error && selectedSemesterId ? (
                <div className="bg-[#FEF2F2] border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
              ) : bySubject.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8 text-center text-[#6B7280]">
                  Chưa có dữ liệu điểm danh cho kì này.
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col className="w-[28%]" />
                        <col className="w-[12%]" />
                        <col className="w-[16%]" />
                        <col className="w-[8%]" />
                        <col className="w-[22%]" />
                        <col className="w-[14%]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-[#374151] border-b border-[#4B5563]">
                          <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wide">Môn học</th>
                          <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wide">Điểm danh</th>
                          <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wide">Tổng buổi học trong kì</th>
                          <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wide">Trễ</th>
                          <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wide">Thời gian học</th>
                          <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wide">Tỷ lệ có mặt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bySubject.map((row) => {
                          const isOverLimit = row.allowedAbsent > 0 && row.absentCount >= row.allowedAbsent;
                          const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
                          const dateRange =
                            row.firstDate && row.lastDate
                              ? `${formatDate(row.firstDate)} – ${formatDate(row.lastDate)}`
                              : "—";
                          const hasTakenSlots = row.takenSlots > 0;
                          const attendanceRate = hasTakenSlots ? Math.round((row.presentCount / row.takenSlots) * 100) : 0;
                          const rateLevel =
                            !hasTakenSlots
                              ? "none"
                              : isOverLimit || attendanceRate < 50
                                ? "red"
                                : attendanceRate < 80
                                  ? "yellow"
                                  : "green";
                          return (
                            <tr
                              key={row.subjectId}
                              className={`border-b border-[#E5E7EB] hover:bg-[#FFF7ED]/50 ${isOverLimit ? "bg-red-50/60" : ""}`}
                            >
                              <td className="px-4 py-4 align-middle">
                                <p className="font-semibold text-[#1F2937]">{row.subjectName}</p>
                                <p className="text-xs text-[#6B7280]">{row.subjectCode}</p>
                              </td>
                              <td className="px-4 py-4 text-center text-sm text-[#374151] align-middle">
                                <span className={isOverLimit ? "font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded" : ""}>
                                  {row.presentCount}/{row.takenSlots}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center text-sm text-[#374151] align-middle">{row.totalSlotsInSemester}</td>
                              <td className="px-4 py-4 text-center text-sm text-[#374151] align-middle">{row.lateCount}</td>
                              <td className="px-4 py-4 text-center text-sm text-[#374151] align-middle">{dateRange}</td>
                              <td className="px-4 py-4 text-center text-sm align-middle">
                                {rateLevel === "none" ? (
                                  <span className="text-[#6B7280] italic">Chưa bắt đầu</span>
                                ) : (
                                  <span
                                    className={
                                      rateLevel === "green"
                                        ? "inline-block font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded"
                                        : rateLevel === "yellow"
                                          ? "inline-block font-semibold text-[#C2410C] bg-[#FFEDD5] px-2 py-1 rounded"
                                          : "inline-block font-semibold text-red-700 bg-red-100 px-2 py-1 rounded"
                                    }
                                  >
                                    {attendanceRate}%
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
};

export default StudentReport;
