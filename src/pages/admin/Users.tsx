import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";
import Footer from "../../components/Footer";

interface UserRow {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt?: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin/users");
        setUsers(res.data.data || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = filterRole ? users.filter((u) => u.role === filterRole) : users;

  return (
    <AdminLayout
      title="Quản lý người dùng"
      breadcrumb={[
        { path: "/admin/dashboard", label: "Trang chủ" },
        { label: "Quản lý người dùng" },
      ]}
    >
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Lọc theo vai trò:</label>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-40"
        >
          <option value="">Tất cả</option>
          <option value="ADMIN">Quản trị</option>
          <option value="LECTURER">Giảng viên</option>
          <option value="STUDENT">Sinh viên</option>
        </select>
        <Link
          to="/admin/users/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition"
        >
          <span className="material-icons-outlined text-lg">person_add</span>
          Tạo tài khoản
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Họ tên</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Email</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Vai trò</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Chưa có người dùng</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{u.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.role === "ADMIN" ? "bg-orange-100 text-orange-700" :
                      u.role === "LECTURER" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"
                    }`}>{u.role === "ADMIN" ? "Quản trị" : u.role === "LECTURER" ? "Giảng viên" : "Sinh viên"}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Footer />
    </AdminLayout>
  );
}

export default AdminUsers;
