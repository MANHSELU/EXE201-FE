import { useState, useEffect } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";
import Footer from "../../components/Footer";

interface Subject {
  _id: string;
  code: string;
  name: string;
  credits: number;
}

const AdminSubjects: React.FC = () => {
  const [list, setList] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [credits, setCredits] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchList = async () => {
    try {
      const res = await api.get("/admin/subjects");
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
      await api.post("/admin/subjects", { code, name, credits });
      setCode("");
      setName("");
      setCredits(3);
      fetchList();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tạo môn học");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Môn học" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Môn học" }]}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Thêm môn học</h2>
            <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã môn</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl w-32 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên môn</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tín chỉ</label>
                <input
                  type="number"
                  min={1}
                  value={credits}
                  onChange={(e) => setCredits(Number(e.target.value))}
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Mã</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Tên</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Tín chỉ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Chưa có môn học</td></tr>
                ) : (
                  list.map((s) => (
                    <tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{s.code}</td>
                      <td className="px-6 py-4 text-gray-700">{s.name}</td>
                      <td className="px-6 py-4 text-gray-600">{s.credits}</td>
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

export default AdminSubjects;
