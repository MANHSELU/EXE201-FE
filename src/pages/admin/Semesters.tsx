import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

interface Semester { _id: string; name: string; startDate: string; endDate: string; }

const IC = "material-icons-outlined";

const AdminSemesters: React.FC = () => {
  const [list, setList] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit
  const [editItem, setEditItem] = useState<Semester | null>(null);
  const [editData, setEditData] = useState({ name: "", startDate: "", endDate: "" });
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const navigate = useNavigate();
  const fetchList = async () => {
    try { const res = await api.get("/admin/semesters"); setList(res.data.data || []); } catch { setList([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchList(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess(""); setSubmitting(true);
    try {
      await api.post("/admin/semesters", { name, startDate, endDate });
      setName(""); setStartDate(""); setEndDate("");
      setSuccess("Tạo kì học thành công!"); setTimeout(() => setSuccess(""), 3000); fetchList();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tạo kì học");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa kì học này?")) return;
    try { await api.delete(`/admin/semesters/${id}`); fetchList(); } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi xóa");
    }
  };

  const openEdit = (s: Semester) => {
    setEditItem(s);
    setEditData({ name: s.name, startDate: s.startDate.split("T")[0], endDate: s.endDate.split("T")[0] });
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editItem) return;
    setEditError(""); setEditSubmitting(true);
    try {
      await api.put(`/admin/semesters/${editItem._id}`, editData);
      setEditItem(null); fetchList();
    } catch (err: unknown) {
      setEditError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi cập nhật");
    } finally { setEditSubmitting(false); }
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition";

  const getDuration = (start: string, end: string) => {
    const s = new Date(start), e = new Date(end);
    const weeks = Math.round((e.getTime() - s.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return weeks > 0 ? `${weeks} tuần` : "—";
  };

  return (
    <AdminLayout title="" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Kì học" }]}>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition" title="Quay lại">
          <span className={IC} style={{ color: "#111827", fontSize: 28 }}>arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý kì học</h1>
          <p className="text-sm text-gray-500">Quản lý các kì học của trung tâm</p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-sm font-semibold text-orange-600">
            <span className={IC} style={{ fontSize: 15 }}>layers</span>{list.length} kì
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
          <span className={IC} style={{ color: "#FF7043", fontSize: 20 }}>add_circle</span>
          <h2 className="font-semibold text-gray-800">Thêm kì học mới</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Tên kì học</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="VD: Khóa 25, Summer 2025" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Ngày bắt đầu</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} style={{ width: 170 }} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Ngày kết thúc</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} style={{ width: 170 }} required />
            </div>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition text-sm">
              <span className={IC} style={{ fontSize: 18 }}>{submitting ? "hourglass_empty" : "add"}</span>
              {submitting ? "Đang tạo..." : "Tạo kì học"}
            </button>
          </form>
          {error && <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg"><span className={IC} style={{ fontSize: 16 }}>error_outline</span>{error}</div>}
          {success && <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-lg"><span className={IC} style={{ fontSize: 16 }}>check_circle</span>{success}</div>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Danh sách kì học</h3>
          <span className="text-xs text-gray-400">{list.length} kì</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tên kì học</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày bắt đầu</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày kết thúc</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thời lượng</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-8 h-8 border-3 border-orange-300 border-t-orange-500 rounded-full animate-spin" style={{ borderWidth: 3 }} />
                    <span className="text-sm">Đang tải dữ liệu...</span>
                  </div>
                </td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <span className={IC} style={{ fontSize: 48, opacity: 0.3 }}>event_busy</span>
                    <p className="font-medium text-gray-500">Chưa có kì học nào</p>
                    <p className="text-sm">Hãy tạo kì học đầu tiên để bắt đầu</p>
                  </div>
                </td></tr>
              ) : (
                list.map((s, idx) => {
                  const now = new Date();
                  const start = new Date(s.startDate);
                  const end = new Date(s.endDate);
                  const isActive = now >= start && now <= end;
                  const isUpcoming = now < start;
                  return (
                    <tr key={s._id} className={`hover:bg-orange-50/30 transition ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <span className={IC} style={{ color: "#FF7043", fontSize: 16 }}>layers</span>
                          </div>
                          <span className="font-semibold text-gray-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{start.toLocaleDateString("vi-VN")}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{end.toLocaleDateString("vi-VN")}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{getDuration(s.startDate, s.endDate)}</td>
                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Đang diễn ra
                          </span>
                        ) : isUpcoming ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />Sắp diễn ra
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />Đã kết thúc
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => openEdit(s)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                            <span className={IC} style={{ fontSize: 14 }}>edit</span>Sửa
                          </button>
                          <button type="button" onClick={() => handleDelete(s._id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                            <span className={IC} style={{ fontSize: 14 }}>delete_outline</span>Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Chỉnh sửa học kì</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tên học kì</label>
                <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className={inputCls} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ngày bắt đầu</label>
                  <input type="date" value={editData.startDate} onChange={(e) => setEditData({ ...editData, startDate: e.target.value })} className={inputCls} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ngày kết thúc</label>
                  <input type="date" value={editData.endDate} onChange={(e) => setEditData({ ...editData, endDate: e.target.value })} className={inputCls} required />
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

export default AdminSemesters;
