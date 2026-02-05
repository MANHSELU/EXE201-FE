import { useState, useEffect } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";
import Footer from "../../components/Footer";

interface Room {
  _id: string;
  name: string;
  capacity: number;
}

const AdminRooms: React.FC = () => {
  const [list, setList] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(40);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchList = async () => {
    try {
      const res = await api.get("/admin/rooms");
      setList(res.data.data || []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/admin/rooms", { name, capacity });
      setName("");
      setCapacity(40);
      fetchList();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tạo phòng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Phòng học" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Phòng học" }]}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Thêm phòng</h2>
            <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên phòng</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl w-32 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="VD: A101"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sức chứa</label>
                <input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-xl w-24 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition"
              >
                Thêm
              </button>
            </form>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Tên phòng</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Sức chứa</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500">Chưa có phòng</td></tr>
                ) : (
                  list.map((r) => (
                    <tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{r.name}</td>
                      <td className="px-6 py-4 text-gray-600">{r.capacity}</td>
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

export default AdminRooms;
