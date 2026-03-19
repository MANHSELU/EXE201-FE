import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

const DAYS = ["", "Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const DAYS_SHORT = ["", "CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const IC = "material-icons-outlined";

interface Subject { _id: string; code: string; name: string; }
interface ClassItem { _id: string; name: string; }
interface RoomItem { _id: string; name: string; }
interface Semester { _id: string; name: string; startDate: string; endDate: string; }
interface User { _id: string; fullName: string; email: string; }
interface TeachingSchedule {
  _id: string;
  teacherId: { _id?: string; fullName: string; email: string };
  subjectId: { _id?: string; code: string; name: string };
  dayOfWeek: number; startTime: string; endTime: string;
}
interface Slot {
  _id: string;
  semesterId?: { _id?: string; name: string };
  subjectId: { code: string; name: string };
  classId: { name: string };
  roomId: { name: string };
  teacherId: { _id?: string; fullName: string; email: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

const AdminTeachingSchedules: React.FC = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<TeachingSchedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(2);
  const [startTime, setStartTime] = useState("07:30");
  const [endTime, setEndTime] = useState("09:30");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit
  const [editItem, setEditItem] = useState<TeachingSchedule | null>(null);
  const [editData, setEditData] = useState({ teacherId: "", subjectId: "", dayOfWeek: 2, startTime: "07:30", endTime: "09:30" });
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Generate
  const [genSemesterId, setGenSemesterId] = useState("");
  const [genTsId, setGenTsId] = useState("");
  const [genClassId, setGenClassId] = useState("");
  const [genRoomId, setGenRoomId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genSuccess, setGenSuccess] = useState("");

  // Generated slots list + filters
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [filterSemesterId, setFilterSemesterId] = useState("");
  const [filterTeacherId, setFilterTeacherId] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const fetchList = async () => {
    try { const res = await api.get("/admin/teaching-schedules"); setList(res.data.data || []); } catch { setList([]); }
  };
  const fetchOptions = async () => {
    try {
      const [subRes, lecRes, classRes, roomRes, semRes] = await Promise.all([
        api.get("/admin/subjects"), api.get("/admin/users?role=LECTURER"),
        api.get("/admin/classes"), api.get("/admin/rooms"), api.get("/admin/semesters"),
      ]);
      setSubjects(subRes.data.data || []); setLecturers(lecRes.data.data || []);
      setClasses(classRes.data.data || []); setRooms(roomRes.data.data || []);
      setSemesters(semRes.data.data || []);
    } catch { /**/ }
  };
  const fetchSlots = async () => {
    setSlotsLoading(true);
    try {
      const url = filterSemesterId ? `/admin/slots?semesterId=${filterSemesterId}` : "/admin/slots";
      const res = await api.get(url);
      setAllSlots(res.data.data || []);
    } catch { setAllSlots([]); }
    finally { setSlotsLoading(false); }
  };

  useEffect(() => { (async () => { setLoading(true); await Promise.all([fetchList(), fetchOptions(), fetchSlots()]); setLoading(false); })(); }, []);
  useEffect(() => { if (!loading) fetchSlots(); }, [filterSemesterId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess(""); setSubmitting(true);
    try {
      await api.post("/admin/teaching-schedules", { teacherId, subjectId, dayOfWeek, startTime, endTime });
      setTeacherId(""); setSubjectId(""); setDayOfWeek(2); setStartTime("07:30"); setEndTime("09:30");
      setSuccess("Thêm lịch dạy thành công!"); setTimeout(() => setSuccess(""), 3000); fetchList();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tạo lịch dạy");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa lịch dạy này?")) return;
    try { await api.delete(`/admin/teaching-schedules/${id}`); fetchList(); } catch { /**/ }
  };

  const openEdit = (ts: TeachingSchedule) => {
    setEditItem(ts);
    setEditData({ teacherId: ts.teacherId?._id || "", subjectId: ts.subjectId?._id || "", dayOfWeek: ts.dayOfWeek, startTime: ts.startTime, endTime: ts.endTime });
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editItem) return;
    setEditError(""); setEditSubmitting(true);
    try { await api.put(`/admin/teaching-schedules/${editItem._id}`, editData); setEditItem(null); fetchList(); }
    catch (err: unknown) { setEditError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi cập nhật"); }
    finally { setEditSubmitting(false); }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault(); setGenError(""); setGenSuccess(""); setGenerating(true);
    try {
      const res = await api.post("/admin/slots/generate", { semesterId: genSemesterId, teachingScheduleId: genTsId, classId: genClassId, roomId: genRoomId });
      setGenSuccess(res.data.message || "Tạo lịch thành công!");
      setTimeout(() => setGenSuccess(""), 5000);
      // Refresh slots list & set filter to the generated semester
      setFilterSemesterId(genSemesterId);
      fetchSlots();
    } catch (err: unknown) {
      setGenError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tạo lịch cả kỳ");
    } finally { setGenerating(false); }
  };

  // Edit slot
  const [editSlot, setEditSlot] = useState<Slot | null>(null);
  const [editSlotData, setEditSlotData] = useState({ subjectId: "", classId: "", roomId: "", teacherId: "", semesterId: "", date: "", startTime: "07:30", endTime: "09:30" });
  const [editSlotError, setEditSlotError] = useState("");
  const [editSlotSubmitting, setEditSlotSubmitting] = useState(false);

  const openEditSlot = (slot: Slot) => {
    setEditSlot(slot);
    setEditSlotData({
      subjectId: (slot.subjectId as unknown as { _id?: string })?._id || "",
      classId: (slot.classId as unknown as { _id?: string })?._id || "",
      roomId: (slot.roomId as unknown as { _id?: string })?._id || "",
      teacherId: slot.teacherId?._id || "",
      semesterId: slot.semesterId?._id || "",
      date: slot.date ? new Date(slot.date).toISOString().split("T")[0] : "",
      startTime: slot.startTime, endTime: slot.endTime,
    });
    setEditSlotError("");
  };

  const handleEditSlot = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editSlot) return;
    setEditSlotError(""); setEditSlotSubmitting(true);
    try { await api.put(`/admin/slots/${editSlot._id}`, editSlotData); setEditSlot(null); fetchSlots(); }
    catch (err: unknown) { setEditSlotError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi cập nhật"); }
    finally { setEditSlotSubmitting(false); }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!window.confirm("Xóa buổi học này?")) return;
    try { await api.delete(`/admin/slots/${id}`); fetchSlots(); } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi xóa");
    }
  };

  // Filter slots
  const filteredSlots = allSlots.filter((s) => {
    if (filterTeacherId && s.teacherId?._id !== filterTeacherId) return false;
    if (filterSubjectId && (s.subjectId as unknown as { _id?: string })?._id !== filterSubjectId) return false;
    if (filterDate) {
      const slotDate = new Date(s.date).toISOString().split("T")[0];
      if (slotDate !== filterDate) return false;
    }
    return true;
  });

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition";

  const slotDayOfWeek = (dateStr: string) => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[new Date(dateStr).getDay()];
  };

  return (
    <AdminLayout title="" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Lịch dạy" }]}>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition" title="Quay lại">
          <span className={IC} style={{ color: "#111827", fontSize: 28 }}>arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý lịch dạy</h1>
          <p className="text-sm text-gray-500">Phân công lịch dạy cố định hàng tuần cho giảng viên</p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-sm font-semibold text-indigo-600">
            <span className={IC} style={{ fontSize: 15 }}>schedule</span>{list.length} lịch dạy
          </span>
        </div>
      </div>

      {/* Thêm lịch dạy tuần */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
          <span className={IC} style={{ color: "#FF7043", fontSize: 20 }}>add_circle</span>
          <h2 className="font-semibold text-gray-800">Thêm lịch dạy mới</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Giảng viên</label>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={inputCls} required>
                <option value="">-- Chọn GV --</option>
                {lecturers.map((l) => <option key={l._id} value={l._id}>{l.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Môn học</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputCls} required>
                <option value="">-- Chọn môn --</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.code} - {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Thứ</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className={inputCls}>
                {DAYS.map((d, i) => i === 0 ? null : <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Giờ bắt đầu</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Giờ kết thúc</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
            </div>
            <div className="md:col-span-2 lg:col-span-5">
              <button type="submit" disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition text-sm">
                <span className={IC} style={{ fontSize: 18 }}>{submitting ? "hourglass_empty" : "add"}</span>
                {submitting ? "Đang thêm..." : "Thêm lịch dạy"}
              </button>
            </div>
          </form>
          {error && <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg"><span className={IC} style={{ fontSize: 16 }}>error_outline</span>{error}</div>}
          {success && <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-lg"><span className={IC} style={{ fontSize: 16 }}>check_circle</span>{success}</div>}
        </div>
      </div>

      {/* Tạo lịch học cả kỳ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
          <span className={IC} style={{ color: "#10B981", fontSize: 20 }}>auto_awesome</span>
          <h2 className="font-semibold text-gray-800">Tạo lịch học cả kỳ (tự động)</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">Chọn lịch dạy tuần, kì học, lớp và phòng — hệ thống sẽ tự tạo tất cả buổi học cho cả kỳ.</p>
          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Lịch dạy tuần</label>
              <select value={genTsId} onChange={(e) => setGenTsId(e.target.value)} className={inputCls} required>
                <option value="">-- Chọn lịch dạy --</option>
                {list.map((ts) => (
                  <option key={ts._id} value={ts._id}>
                    {ts.teacherId?.fullName} - {ts.subjectId?.code} - {DAYS_SHORT[ts.dayOfWeek]} ({ts.startTime}-{ts.endTime})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Kì học</label>
              <select value={genSemesterId} onChange={(e) => setGenSemesterId(e.target.value)} className={inputCls} required>
                <option value="">-- Chọn kì học --</option>
                {semesters.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Lớp học</label>
              <select value={genClassId} onChange={(e) => setGenClassId(e.target.value)} className={inputCls} required>
                <option value="">-- Chọn lớp --</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Phòng học</label>
              <select value={genRoomId} onChange={(e) => setGenRoomId(e.target.value)} className={inputCls} required>
                <option value="">-- Chọn phòng --</option>
                {rooms.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <button type="submit" disabled={generating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 transition text-sm">
                <span className={IC} style={{ fontSize: 18 }}>{generating ? "hourglass_empty" : "auto_awesome"}</span>
                {generating ? "Đang tạo..." : "Tạo lịch học cả kỳ"}
              </button>
            </div>
          </form>
          {genError && <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg"><span className={IC} style={{ fontSize: 16 }}>error_outline</span>{genError}</div>}
          {genSuccess && <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-lg"><span className={IC} style={{ fontSize: 16 }}>check_circle</span>{genSuccess}</div>}
        </div>
      </div>

      {/* Danh sách lịch dạy với filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Danh sách lịch dạy</h3>
          <span className="text-xs text-gray-400">{filteredSlots.length} buổi</span>
        </div>
        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={IC} style={{ fontSize: 16, color: "#9CA3AF" }}>filter_list</span>
            <span className="text-xs font-semibold text-gray-500 uppercase">Lọc:</span>
          </div>
          <select value={filterSemesterId} onChange={(e) => setFilterSemesterId(e.target.value)}
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
          {(filterSemesterId || filterTeacherId || filterSubjectId || filterDate) && (
            <button type="button" onClick={() => { setFilterSemesterId(""); setFilterTeacherId(""); setFilterSubjectId(""); setFilterDate(""); }}
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
              {slotsLoading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "3px solid #A7F3D0", borderTopColor: "#10B981" }} />
                    <span className="text-sm">Đang tải...</span>
                  </div>
                </td></tr>
              ) : filteredSlots.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <span className={IC} style={{ fontSize: 48, opacity: 0.3 }}>calendar_today</span>
                    <p className="font-medium text-gray-500">Chưa có buổi học nào</p>
                    <p className="text-sm">Hãy tạo lịch dạy tuần rồi bấm "Tạo lịch học cả kỳ" ở trên</p>
                  </div>
                </td></tr>
              ) : (
                filteredSlots.map((slot, idx) => (
                  <tr key={slot._id} className={`hover:bg-green-50/30 transition ${idx % 2 === 0 ? "" : "bg-gray-50/20"}`}>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        {slot.semesterId?.name || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">
                          {slotDayOfWeek(slot.date)}
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
                        <button type="button" onClick={() => openEditSlot(slot)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                          <span className={IC} style={{ fontSize: 14 }}>edit</span>Sửa
                        </button>
                        <button type="button" onClick={() => handleDeleteSlot(slot._id)}
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

      {/* Edit Slot Modal */}
      {editSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditSlot(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Chỉnh sửa buổi học</h3>
            <form onSubmit={handleEditSlot} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Kì học</label>
                  <select value={editSlotData.semesterId} onChange={(e) => setEditSlotData({ ...editSlotData, semesterId: e.target.value })} className={inputCls}>
                    <option value="">-- Chọn --</option>
                    {semesters.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ngày</label>
                  <input type="date" value={editSlotData.date} onChange={(e) => setEditSlotData({ ...editSlotData, date: e.target.value })} className={inputCls} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Môn học</label>
                  <select value={editSlotData.subjectId} onChange={(e) => setEditSlotData({ ...editSlotData, subjectId: e.target.value })} className={inputCls}>
                    {subjects.map((s) => <option key={s._id} value={s._id}>{s.code} - {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Lớp</label>
                  <select value={editSlotData.classId} onChange={(e) => setEditSlotData({ ...editSlotData, classId: e.target.value })} className={inputCls}>
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phòng</label>
                  <select value={editSlotData.roomId} onChange={(e) => setEditSlotData({ ...editSlotData, roomId: e.target.value })} className={inputCls}>
                    {rooms.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Giảng viên</label>
                  <select value={editSlotData.teacherId} onChange={(e) => setEditSlotData({ ...editSlotData, teacherId: e.target.value })} className={inputCls}>
                    {lecturers.map((l) => <option key={l._id} value={l._id}>{l.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Giờ bắt đầu</label>
                  <input type="time" value={editSlotData.startTime} onChange={(e) => setEditSlotData({ ...editSlotData, startTime: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Giờ kết thúc</label>
                  <input type="time" value={editSlotData.endTime} onChange={(e) => setEditSlotData({ ...editSlotData, endTime: e.target.value })} className={inputCls} />
                </div>
              </div>
              {editSlotError && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{editSlotError}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editSlotSubmitting} className="px-5 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition text-sm">
                  {editSlotSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button type="button" onClick={() => setEditSlot(null)} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teaching Schedule Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Chỉnh sửa lịch dạy</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Giảng viên</label>
                  <select value={editData.teacherId} onChange={(e) => setEditData({ ...editData, teacherId: e.target.value })} className={inputCls}>
                    {lecturers.map((l) => <option key={l._id} value={l._id}>{l.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Môn học</label>
                  <select value={editData.subjectId} onChange={(e) => setEditData({ ...editData, subjectId: e.target.value })} className={inputCls}>
                    {subjects.map((s) => <option key={s._id} value={s._id}>{s.code} - {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Thứ</label>
                  <select value={editData.dayOfWeek} onChange={(e) => setEditData({ ...editData, dayOfWeek: Number(e.target.value) })} className={inputCls}>
                    {DAYS.map((d, i) => i === 0 ? null : <option key={i} value={i}>{d}</option>)}
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
                <button type="submit" disabled={editSubmitting} className="px-5 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition text-sm">
                  {editSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button type="button" onClick={() => setEditItem(null)} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTeachingSchedules;
