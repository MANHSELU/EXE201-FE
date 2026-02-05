import { useState, useEffect } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";
import Footer from "../../components/Footer";

interface ClassItem {
  _id: string;
  name: string;
  courseYear: number;
}

const AdminClasses: React.FC = () => {
  const [list, setList] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [courseYear, setCourseYear] = useState(new Date().getFullYear());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchList = async () => {
    try {
      const res = await api.get("/admin/classes");
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
      await api.post("/admin/classes", { name, courseYear });
      setName("");
      setCourseYear(new Date().getFullYear());
      fetchList();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tạo lớp");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Lớp học" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Lớp học" }]}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Thêm lớp</h2>
            <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên lớp</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl w-40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="VD: SE1801"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khóa</label>
                <input
                  type="number"
                  value={courseYear}
                  onChange={(e) => setCourseYear(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-xl w-28 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Tên lớp</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Khóa</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500">Chưa có lớp</td></tr>
                ) : (
                  list.map((c) => (
                    <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{c.name}</td>
                      <td className="px-6 py-4 text-gray-600">{c.courseYear}</td>
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

export default AdminClasses;
