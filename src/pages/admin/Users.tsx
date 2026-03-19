import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

interface UserRow { _id: string; fullName: string; email: string; role: string; createdAt?: string; }

const IC = "material-icons-outlined";

const ROLE_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  ADMIN:    { label: "Quản trị viên", cls: "bg-orange-100 text-orange-700", icon: "admin_panel_settings" },
  LECTURER: { label: "Giảng viên",    cls: "bg-blue-100 text-blue-700",    icon: "person_book" },
  STUDENT:  { label: "Học viên",      cls: "bg-green-100 text-green-700",  icon: "school" },
};

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const res = await api.get("/admin/users"); setUsers(res.data.data || []); }
      catch { setUsers([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = filterRole ? users.filter((u) => u.role === filterRole) : users;

  const counts = {
    all: users.length,
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    LECTURER: users.filter((u) => u.role === "LECTURER").length,
    STUDENT: users.filter((u) => u.role === "STUDENT").length,
  };

  return (
    <AdminLayout title="" breadcrumb={[{ path: "/admin/dashboard", label: "Trang chủ" }, { label: "Người dùng" }]}>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition" title="Quay lại">
          <span className={IC} style={{ color: "#111827", fontSize: 28 }}>arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý tài khoản</h1>
          <p className="text-sm text-gray-500">Danh sách tất cả tài khoản trong hệ thống</p>
        </div>
        <div className="ml-auto">
          <Link to="/admin/users/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition text-sm">
            <span className={IC} style={{ fontSize: 18 }}>person_add</span>
            Tạo tài khoản
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { key: "", label: "Tất cả", count: counts.all, icon: "people", color: "bg-gray-100 text-gray-600 border-gray-200" },
          { key: "ADMIN", label: "Quản trị viên", count: counts.ADMIN, icon: "admin_panel_settings", color: "bg-orange-50 text-orange-600 border-orange-200" },
          { key: "LECTURER", label: "Giảng viên", count: counts.LECTURER, icon: "person_book", color: "bg-blue-50 text-blue-600 border-blue-200" },
          { key: "STUDENT", label: "Học viên", count: counts.STUDENT, icon: "school", color: "bg-green-50 text-green-600 border-green-200" },
        ].map((item) => (
          <button key={item.key} type="button" onClick={() => setFilterRole(item.key)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition text-left w-full ${
              filterRole === item.key ? `${item.color} shadow-sm font-semibold` : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
            }`}>
            <span className={IC} style={{ fontSize: 22 }}>{item.icon}</span>
            <div>
              <p className="text-2xl font-bold leading-none">{item.count}</p>
              <p className="text-xs mt-0.5 opacity-80">{item.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            {filterRole ? `${ROLE_CONFIG[filterRole]?.label}` : "Tất cả người dùng"}
          </h3>
          <span className="text-xs text-gray-400">{filtered.length} người</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Họ tên</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "3px solid #FED7AA", borderTopColor: "#FF7043" }} />
                    <span className="text-sm">Đang tải...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <span className={IC} style={{ fontSize: 48, opacity: 0.3 }}>person_off</span>
                    <p className="font-medium text-gray-500">Không tìm thấy người dùng nào</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((u, idx) => {
                  const cfg = ROLE_CONFIG[u.role] || { label: u.role, cls: "bg-gray-100 text-gray-600", icon: "person" };
                  return (
                    <tr key={u._id} className={`hover:bg-orange-50/20 transition ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                            style={{ background: u.role === "ADMIN" ? "#FF7043" : u.role === "LECTURER" ? "#3B82F6" : "#10B981" }}>
                            {u.fullName?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
                          <span className={IC} style={{ fontSize: 13 }}>{cfg.icon}</span>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
