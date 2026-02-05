import { useState, useEffect } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";
import Footer from "../../components/Footer";

interface Semester {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
}

const AdminSemesters: React.FC = () => {
  const [list, setList] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchList = async () => {
    try {
      const res = await api.get("/admin/semesters");
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
      await api.post("/admin/semesters", { name, startDate, endDate });
      setName("");
      setStartDate("");
      setEndDate("");
      fetchList();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tạo kì học");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Kì học" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Kì học" }]}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Thêm kì học</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên kì</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl w-48 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="VD: Kì 1 2024, Summer 2024"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition"
          >
            Thêm kì
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Tên kì</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Từ ngày</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Đến ngày</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Chưa có kì học. Tạo kì trước khi tạo slot.</td></tr>
            ) : (
              list.map((s) => (
                <tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                  <td className="px-6 py-4 text-gray-600">{new Date(s.startDate).toLocaleDateString("vi-VN")}</td>
                  <td className="px-6 py-4 text-gray-600">{new Date(s.endDate).toLocaleDateString("vi-VN")}</td>
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

export default AdminSemesters;
