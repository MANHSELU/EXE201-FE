import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

interface Room { _id: string; name: string; capacity: number; }

const IC = "material-icons-outlined";

const AdminRooms: React.FC = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(40);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editItem, setEditItem] = useState<Room | null>(null);
  const [editData, setEditData] = useState({ name: "", capacity: 40 });
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchList = async () => {
    try { const res = await api.get("/admin/rooms"); setList(res.data.data || []); } catch { setList([]); } finally { setLoading(false); }
  };
  useEffect(() => { fetchList(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess(""); setSubmitting(true);
    try {
      await api.post("/admin/rooms", { name, capacity });
      setName(""); setCapacity(40);
      setSuccess("Thêm phòng học thành công!"); setTimeout(() => setSuccess(""), 3000); fetchList();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tạo phòng");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa phòng học này?")) return;
    try { await api.delete(`/admin/rooms/${id}`); fetchList(); } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi xóa");
    }
  };

  const openEdit = (r: Room) => { setEditItem(r); setEditData({ name: r.name, capacity: r.capacity }); setEditError(""); };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editItem) return;
    setEditError(""); setEditSubmitting(true);
    try { await api.put(`/admin/rooms/${editItem._id}`, editData); setEditItem(null); fetchList(); }
    catch (err: unknown) { setEditError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi cập nhật"); }
    finally { setEditSubmitting(false); }
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition";

  const getCapacityColor = (cap: number) => {
    if (cap >= 60) return "bg-green-100 text-green-700";
    if (cap >= 30) return "bg-blue-100 text-blue-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <AdminLayout title="" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Phòng học" }]}>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition" title="Quay lại">
          <span className={IC} style={{ color: "#111827", fontSize: 28 }}>arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý phòng học</h1>
          <p className="text-sm text-gray-500">Quản lý danh sách phòng học của trung tâm</p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm font-semibold text-green-600">
            <span className={IC} style={{ fontSize: 15 }}>meeting_room</span>{list.length} phòng
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
          <span className={IC} style={{ color: "#FF7043", fontSize: 20 }}>add_circle</span>
          <h2 className="font-semibold text-gray-800">Thêm phòng học mới</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tên phòng</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="VD: A101, Lab3" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sức chứa</label>
              <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={inputCls} style={{ width: 110 }} />
            </div>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition text-sm">
              <span className={IC} style={{ fontSize: 18 }}>{submitting ? "hourglass_empty" : "add"}</span>
              {submitting ? "Đang thêm..." : "Thêm phòng"}
            </button>
          </form>
          {error && <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg"><span className={IC} style={{ fontSize: 16 }}>error_outline</span>{error}</div>}
          {success && <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-lg"><span className={IC} style={{ fontSize: 16 }}>check_circle</span>{success}</div>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Danh sách phòng học</h3>
          <span className="text-xs text-gray-400">{list.length} phòng</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phòng</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sức chứa</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Quy mô</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "3px solid #A7F3D0", borderTopColor: "#10B981" }} />
                    <span className="text-sm">Đang tải...</span>
                  </div>
                </td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <span className={IC} style={{ fontSize: 48, opacity: 0.3 }}>meeting_room</span>
                    <p className="font-medium text-gray-500">Chưa có phòng học nào</p>
                  </div>
                </td></tr>
              ) : (
                list.map((r, idx) => (
                  <tr key={r._id} className={`hover:bg-green-50/30 transition ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className={IC} style={{ color: "#10B981", fontSize: 16 }}>door_front</span>
                        </div>
                        <span className="font-semibold text-gray-800">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={IC} style={{ fontSize: 16, color: "#9CA3AF" }}>group</span>
                        <span className="text-sm text-gray-700">{r.capacity} người</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getCapacityColor(r.capacity)}`}>
                        {r.capacity >= 60 ? "Lớn" : r.capacity >= 30 ? "Vừa" : "Nhỏ"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => openEdit(r)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                          <span className={IC} style={{ fontSize: 14 }}>edit</span>Sửa
                        </button>
                        <button type="button" onClick={() => handleDelete(r._id)}
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

      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Chỉnh sửa phòng học</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tên phòng</label>
                <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Sức chứa</label>
                <input type="number" min={1} value={editData.capacity} onChange={(e) => setEditData({ ...editData, capacity: Number(e.target.value) })} className={inputCls} />
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

export default AdminRooms;
