import { useState, useEffect } from "react";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";
import Footer from "../../components/Footer";

interface ClassItem {
  _id: string;
  name: string;
}
interface Student {
  _id: string;
  fullName: string;
  email: string;
}

const AdminClassStudents: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [addStudentId, setAddStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchClasses = async () => {
    try {
      const res = await api.get("/admin/classes");
      setClasses(res.data.data || []);
    } catch {
      setClasses([]);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await api.get("/admin/users?role=STUDENT");
      setAllStudents(res.data.data || []);
    } catch {
      setAllStudents([]);
    }
  };

  const fetchClassStudents = async (classId: string) => {
    if (!classId) {
      setClassStudents([]);
      return;
    }
    try {
      const res = await api.get(`/admin/classes/${classId}/students`);
      setClassStudents(res.data.data || []);
    } catch {
      setClassStudents([]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchClasses(), fetchAllStudents()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (selectedClassId) fetchClassStudents(selectedClassId);
    else setClassStudents([]);
  }, [selectedClassId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !addStudentId) return;
    setError("");
    setSubmitting(true);
    try {
      await api.post(`/admin/classes/${selectedClassId}/students`, { studentId: addStudentId });
      setAddStudentId("");
      fetchClassStudents(selectedClassId);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi thêm sinh viên");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (studentId: string) => {
    if (!selectedClassId || !window.confirm("Xóa sinh viên khỏi lớp?")) return;
    try {
      await api.delete(`/admin/classes/${selectedClassId}/students/${studentId}`);
      fetchClassStudents(selectedClassId);
    } catch {
      //
    }
  };

  const alreadyInClass = classStudents.map((s) => s._id);
  const availableToAdd = allStudents.filter((s) => !alreadyInClass.includes(s._id));
  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

  return (
    <AdminLayout title="Sinh viên theo lớp" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Sinh viên theo lớp" }]}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn lớp</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className={`max-w-xs ${inputClass}`}
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedClassId && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Thêm sinh viên vào lớp</h2>
                <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sinh viên</label>
                    <select value={addStudentId} onChange={(e) => setAddStudentId(e.target.value)} className={inputClass}>
                      <option value="">-- Chọn sinh viên --</option>
                      {availableToAdd.map((s) => (
                        <option key={s._id} value={s._id}>{s.fullName} ({s.email})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !addStudentId}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition"
                  >
                    Thêm vào lớp
                  </button>
                </form>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <h2 className="px-6 py-4 font-semibold text-gray-800 border-b border-gray-200 bg-gray-50">Danh sách sinh viên trong lớp</h2>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Họ tên</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                    ) : classStudents.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Chưa có sinh viên trong lớp</td></tr>
                    ) : (
                      classStudents.map((s) => (
                        <tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-800">{s.fullName}</td>
                          <td className="px-6 py-4 text-gray-600">{s.email}</td>
                          <td className="px-6 py-4">
                            <button type="button" onClick={() => handleRemove(s._id)} className="text-orange-600 hover:text-orange-700 text-sm font-medium transition">
                              Xóa khỏi lớp
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
      <Footer />
    </AdminLayout>
  );
};

export default AdminClassStudents;
