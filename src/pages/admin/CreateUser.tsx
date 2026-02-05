import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";
import Footer from "../../components/Footer";

interface Role {
  _id: string;
  name: string;
  description?: string;
}

const AdminCreateUser: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get("/admin/roles");
        const list = (res.data.data || []).filter((r: Role) => r.name !== "ADMIN" || true);
        setRoles(list);
        if (list.length) setRole((prev) => prev || list.find((r: Role) => r.name === "STUDENT")?.name || list[0].name);
      } catch {
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);
    try {
      await api.post("/admin/users", { email, password, fullName, role });
      setSuccess(true);
      setEmail("");
      setPassword("");
      setFullName("");
      setRole(roles[0]?.name || "");
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tạo tài khoản");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

  return (
    <AdminLayout
      title="Tạo tài khoản"
      breadcrumb={[
        { path: "/admin/dashboard", label: "Trang chủ" },
        { path: "/admin/users", label: "Quản lý người dùng" },
        { label: "Tạo tài khoản" },
      ]}
    >
      <div className="max-w-xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin tài khoản</h2>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Đang tải...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="user@school.edu"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Tối thiểu 6 ký tự</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">-- Chọn vai trò --</option>
                  {roles.map((r) => (
                    <option key={r._id} value={r.name}>
                      {r.name === "ADMIN" ? "Quản trị viên" : r.name === "LECTURER" ? "Giảng viên" : "Sinh viên"}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">Tạo tài khoản thành công.</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition"
                >
                  {submitting ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
                <Link
                  to="/admin/users"
                  className="px-4 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Quay lại
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </AdminLayout>
  );
}

export default AdminCreateUser;
