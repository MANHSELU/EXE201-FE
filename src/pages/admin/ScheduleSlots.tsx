import { useState, useEffect } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";
import Footer from "../../components/Footer";

interface Subject {
  _id: string;
  code: string;
  name: string;
}
interface ClassItem {
  _id: string;
  name: string;
}
interface Room {
  _id: string;
  name: string;
}
interface User {
  _id: string;
  fullName: string;
  email: string;
}
interface Semester {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
}
interface Slot {
  _id: string;
  semesterId?: { name: string };
  subjectId: { code: string; name: string };
  classId: { name: string };
  roomId: { name: string };
  teacherId: { fullName: string; email: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

const AdminScheduleSlots: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("07:30");
  const [endTime, setEndTime] = useState("09:30");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchSlots = async () => {
    try {
      const url = selectedSemesterId ? `/admin/slots?semesterId=${selectedSemesterId}` : "/admin/slots";
      const res = await api.get(url);
      setSlots(res.data.data || []);
    } catch {
      setSlots([]);
    }
  };

  const fetchOptions = async () => {
    try {
      const [semRes, subRes, classRes, roomRes, lecRes] = await Promise.all([
        api.get("/admin/semesters"),
        api.get("/admin/subjects"),
        api.get("/admin/classes"),
        api.get("/admin/rooms"),
        api.get("/admin/users?role=LECTURER"),
      ]);
      setSemesters(semRes.data.data || []);
      setSubjects(subRes.data.data || []);
      setClasses(classRes.data.data || []);
      setRooms(roomRes.data.data || []);
      setLecturers(lecRes.data.data || []);
    } catch {
      //
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchSlots(), fetchOptions()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading) fetchSlots();
  }, [selectedSemesterId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const sid = semesterId || selectedSemesterId;
      if (!sid) {
        setError("Vui lòng chọn kì học.");
        setSubmitting(false);
        return;
      }
      await api.post("/admin/slots", {
        semesterId: sid,
        subjectId,
        classId,
        roomId,
        teacherId,
        date,
        startTime,
        endTime,
      });
      setDate("");
      setStartTime("07:30");
      setEndTime("09:30");
      if (!selectedSemesterId) setSelectedSemesterId(sid);
      fetchSlots();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tạo buổi học");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa buổi học này?")) return;
    try {
      await api.delete(`/admin/slots/${id}`);
      fetchSlots();
    } catch {
      //
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

  return (
    <AdminLayout title="Lịch học (tiết)" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Lịch học" }]}>
          <div className="mb-4 flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Lọc theo kì:</label>
            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className={`max-w-xs ${inputClass}`}
            >
              <option value="">Tất cả kì</option>
              {semesters.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Tạo buổi học (theo kì)</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kì học</label>
                <select value={semesterId || selectedSemesterId} onChange={(e) => setSemesterId(e.target.value)} className={inputClass} required>
                  <option value="">-- Chọn kì --</option>
                  {semesters.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputClass} required>
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phòng</label>
                <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className={inputClass} required>
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition">
                  Tạo buổi học
                </button>
              </div>
            </form>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Kì</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Ngày</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Môn</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Lớp</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Phòng</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Giảng viên</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Giờ</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                ) : slots.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Chưa có buổi học. Chọn kì và tạo buổi học.</td></tr>
                ) : (
                  slots.map((slot) => (
                    <tr key={slot._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{slot.semesterId?.name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{new Date(slot.date).toLocaleDateString("vi-VN")}</td>
                      <td className="px-6 py-4 text-sm">{slot.subjectId?.code} - {slot.subjectId?.name}</td>
                      <td className="px-6 py-4 text-sm">{slot.classId?.name}</td>
                      <td className="px-6 py-4 text-sm">{slot.roomId?.name}</td>
                      <td className="px-6 py-4 text-sm">{slot.teacherId?.fullName}</td>
                      <td className="px-6 py-4 text-sm">{slot.startTime} - {slot.endTime}</td>
                      <td className="px-6 py-4">
                        <button type="button" onClick={() => handleDelete(slot._id)} className="text-orange-600 hover:text-orange-700 text-sm font-medium transition">
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

export default AdminScheduleSlots;
