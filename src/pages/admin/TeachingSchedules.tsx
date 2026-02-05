import { useState, useEffect } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";
import Footer from "../../components/Footer";

const DAYS = ["", "Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

interface Subject {
  _id: string;
  code: string;
  name: string;
}
interface User {
  _id: string;
  fullName: string;
  email: string;
}
interface TeachingSchedule {
  _id: string;
  teacherId: { fullName: string; email: string };
  subjectId: { code: string; name: string };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const AdminTeachingSchedules: React.FC = () => {
  const [list, setList] = useState<TeachingSchedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(2);
  const [startTime, setStartTime] = useState("07:30");
  const [endTime, setEndTime] = useState("09:30");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchList = async () => {
    try {
      const res = await api.get("/admin/teaching-schedules");
      setList(res.data.data || []);
    } catch {
      setList([]);
    }
  };

  const fetchOptions = async () => {
    try {
      const [subRes, lecRes] = await Promise.all([
        api.get("/admin/subjects"),
        api.get("/admin/users?role=LECTURER"),
      ]);
      setSubjects(subRes.data.data || []);
      setLecturers(lecRes.data.data || []);
    } catch {
      //
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchList(), fetchOptions()]);
      setLoading(false);
    })();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/admin/teaching-schedules", { teacherId, subjectId, dayOfWeek, startTime, endTime });
      setTeacherId("");
      setSubjectId("");
      setDayOfWeek(2);
      setStartTime("07:30");
      setEndTime("09:30");
      fetchList();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tạo lịch dạy");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa lịch dạy này?")) return;
    try {
      await api.delete(`/admin/teaching-schedules/${id}`);
      fetchList();
    } catch {
      //
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

  return (
    <AdminLayout title="Lịch dạy (theo tuần)" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Lịch dạy" }]}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Thêm lịch dạy</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảng viên</label>
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={inputClass} required>
                  <option value="">-- Chọn GV --</option>
                  {lecturers.map((l) => (
                    <option key={l._id} value={l._id}>{l.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Môn học</label>
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputClass} required>
                  <option value="">-- Chọn môn --</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thứ</label>
                <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className={inputClass}>
                  {DAYS.map((d, i) => i === 0 ? null : <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition">
                  Thêm lịch dạy
                </button>
              </div>
            </form>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Giảng viên</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Môn học</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Thứ</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Giờ</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Chưa có lịch dạy</td></tr>
                ) : (
                  list.map((ts) => (
                    <tr key={ts._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{ts.teacherId?.fullName}</td>
                      <td className="px-6 py-4 text-sm">{ts.subjectId?.code} - {ts.subjectId?.name}</td>
                      <td className="px-6 py-4 text-sm">{DAYS[ts.dayOfWeek] || ts.dayOfWeek}</td>
                      <td className="px-6 py-4 text-sm">{ts.startTime} - {ts.endTime}</td>
                      <td className="px-6 py-4">
                        <button type="button" onClick={() => handleDelete(ts._id)} className="text-orange-600 hover:text-orange-700 text-sm font-medium transition">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      <Footer />
    </AdminLayout>
  );
};

export default AdminTeachingSchedules;
