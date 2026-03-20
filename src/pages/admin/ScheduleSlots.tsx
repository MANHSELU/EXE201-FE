import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

interface Subject { _id: string; code: string; name: string; }
interface ClassItem { _id: string; name: string; }
interface Room { _id: string; name: string; }
interface User { _id: string; fullName: string; email: string; }
interface Semester { _id: string; name: string; startDate: string; endDate: string; }
interface Slot {
  _id: string;
  semesterId?: { name: string };
  subjectId: { code: string; name: string };
  classId: { name: string };
  roomId: { name: string };
  teacherId: { _id?: string; fullName: string; email: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

const IC = "material-icons-outlined";

const AdminScheduleSlots: React.FC = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [, setClasses] = useState<ClassItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");


  // Filters
  const [filterTeacherId, setFilterTeacherId] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Edit modal
  const [editSlot, setEditSlot] = useState<Slot | null>(null);
  const [editData, setEditData] = useState({ subjectId: "", classId: "", roomId: "", teacherId: "", date: "", startTime: "", endTime: "" });
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchSlots = async () => {
    try {
      const url = selectedSemesterId ? `/admin/slots?semesterId=${selectedSemesterId}` : "/admin/slots";
      const res = await api.get(url);
      setSlots(res.data.data || []);
    } catch { setSlots([]); }
  };

  const fetchOptions = async () => {
    try {
      const [semRes, subRes, classRes, roomRes, lecRes] = await Promise.all([
        api.get("/admin/semesters"), api.get("/admin/subjects"), api.get("/admin/classes"),
        api.get("/admin/rooms"), api.get("/admin/users?role=LECTURER"),
      ]);
      setSemesters(semRes.data.data || []); setSubjects(subRes.data.data || []);
      setClasses(classRes.data.data || []); setRooms(roomRes.data.data || []);
      setLecturers(lecRes.data.data || []);
    } catch { /**/ }
  };

  useEffect(() => {
    (async () => { setLoading(true); await Promise.all([fetchSlots(), fetchOptions()]); setLoading(false); })();
  }, []);

  useEffect(() => { if (!loading) fetchSlots(); }, [selectedSemesterId]);


  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa buổi học này?")) return;
    try { await api.delete(`/admin/slots/${id}`); fetchSlots(); }
    catch (err: unknown) { alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi xóa"); }
  };

  const openEdit = (slot: Slot) => {
    setEditSlot(slot);
    setEditData({
      subjectId: "", classId: "", roomId: "", teacherId: "",
      date: slot.date ? new Date(slot.date).toISOString().split("T")[0] : "",
      startTime: slot.startTime, endTime: slot.endTime,
    });
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editSlot) return;
    setEditError(""); setEditSubmitting(true);
    try {
      const body: Record<string, string> = {};
      if (editData.date) body.date = editData.date;
      if (editData.startTime) body.startTime = editData.startTime;
      if (editData.endTime) body.endTime = editData.endTime;
      if (editData.subjectId) body.subjectId = editData.subjectId;
      if (editData.classId) body.classId = editData.classId;
      if (editData.roomId) body.roomId = editData.roomId;
      if (editData.teacherId) body.teacherId = editData.teacherId;
      await api.put(`/admin/slots/${editSlot._id}`, body);
      setEditSlot(null); fetchSlots();
    } catch (err: unknown) {
      setEditError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi cập nhật");
    } finally { setEditSubmitting(false); }
  };

  // Filter slots
  const filteredSlots = slots.filter((s) => {
    if (filterTeacherId && s.teacherId?._id !== filterTeacherId) return false;
    if (filterSubjectId && (s.subjectId as unknown as { _id?: string })?._id !== filterSubjectId) return false;
    if (filterDate) {
      const slotDate = new Date(s.date).toISOString().split("T")[0];
      if (slotDate !== filterDate) return false;
    }
    return true;
  });

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition";

  const dayOfWeek = (dateStr: string) => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[new Date(dateStr).getDay()];
  };

  return (
    <AdminLayout title="" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Lịch học" }]}>
      {/* Page header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition" title="Quay lại">
          <span className={IC} style={{ color: "#111827", fontSize: 28 }}>arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý lịch học</h1>
          <p className="text-sm text-gray-500">Xem và quản lý các buổi học theo kì học</p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm font-semibold text-amber-600">
            <span className={IC} style={{ fontSize: 15 }}>calendar_today</span>{slots.length} buổi
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Danh sách lịch học</h3>
          <span className="text-xs text-gray-400">{filteredSlots.length} buổi</span>
        </div>
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={IC} style={{ fontSize: 16, color: "#9CA3AF" }}>filter_list</span>
            <span className="text-xs font-semibold text-gray-500 uppercase">Lọc:</span>
          </div>
          <select value={selectedSemesterId} onChange={(e) => setSelectedSemesterId(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white min-w-[160px]">
            <option value="">Tất cả kì</option>
            {semesters.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select value={filterTeacherId} onChange={(e) => setFilterTeacherId(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white min-w-[160px]">
            <option value="">Tất cả giảng viên</option>
            {lecturers.map((l) => <option key={l._id} value={l._id}>{l.fullName}</option>)}
          </select>
          <select value={filterSubjectId} onChange={(e) => setFilterSubjectId(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white min-w-[160px]">
            <option value="">Tất cả môn học</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.code} - {s.name}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
          {(selectedSemesterId || filterTeacherId || filterSubjectId || filterDate) && (
            <button type="button" onClick={() => { setSelectedSemesterId(""); setFilterTeacherId(""); setFilterSubjectId(""); setFilterDate(""); }}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              Xóa bộ lọc
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kì học</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Môn học</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lớp</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phòng</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Giảng viên</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Giờ học</th>
                <th className="px-5 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "3px solid #FED7AA", borderTopColor: "#FF7043" }} />
                    <span className="text-sm">Đang tải...</span>
                  </div>
                </td></tr>
              ) : filteredSlots.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <span className={IC} style={{ fontSize: 48, opacity: 0.3 }}>calendar_today</span>
                    <p className="font-medium text-gray-500">Chưa có buổi học nào</p>
                    <p className="text-sm">{selectedSemesterId ? "Kì này chưa có buổi học." : "Chọn kì học và tạo buổi học."}</p>
                  </div>
                </td></tr>
              ) : (
                filteredSlots.map((slot, idx) => (
                  <tr key={slot._id} className={`hover:bg-orange-50/30 transition ${idx % 2 === 0 ? "" : "bg-gray-50/20"}`}>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        {slot.semesterId?.name || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">
                          {dayOfWeek(slot.date)}
                        </span>
                        <span className="text-sm text-gray-700">{new Date(slot.date).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-gray-800">{slot.subjectId?.code}</span>
                      <span className="text-xs text-gray-500 block">{slot.subjectId?.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                        {slot.classId?.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{slot.roomId?.name}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-orange-600">{slot.teacherId?.fullName?.charAt(0)}</span>
                        </div>
                        <span className="text-sm text-gray-700">{slot.teacherId?.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <span className={IC} style={{ fontSize: 14, color: "#9CA3AF" }}>schedule</span>
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => openEdit(slot)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                          <span className={IC} style={{ fontSize: 14 }}>edit</span>Sửa
                        </button>
                        <button type="button" onClick={() => handleDelete(slot._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                          <span className={IC} style={{ fontSize: 14 }}>delete_outline</span>Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditSlot(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Chỉnh sửa buổi học</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ngày học</label>
                  <input type="date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Giảng viên</label>
                  <select value={editData.teacherId} onChange={(e) => setEditData({ ...editData, teacherId: e.target.value })} className={inputCls}>
                    <option value="">-- Không đổi --</option>
                    {lecturers.map((l) => <option key={l._id} value={l._id}>{l.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phòng</label>
                  <select value={editData.roomId} onChange={(e) => setEditData({ ...editData, roomId: e.target.value })} className={inputCls}>
                    <option value="">-- Không đổi --</option>
                    {rooms.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Môn học</label>
                  <select value={editData.subjectId} onChange={(e) => setEditData({ ...editData, subjectId: e.target.value })} className={inputCls}>
                    <option value="">-- Không đổi --</option>
                    {subjects.map((s) => <option key={s._id} value={s._id}>{s.code} - {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Giờ bắt đầu</label>
                  <input type="time" value={editData.startTime} onChange={(e) => setEditData({ ...editData, startTime: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Giờ kết thúc</label>
                  <input type="time" value={editData.endTime} onChange={(e) => setEditData({ ...editData, endTime: e.target.value })} className={inputCls} />
                </div>
              </div>
              {editError && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{editError}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editSubmitting}
                  className="px-5 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition text-sm">
                  {editSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button type="button" onClick={() => setEditSlot(null)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminScheduleSlots;
