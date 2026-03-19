import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

interface Role {
  _id: string;
  name: string;
  description?: string;
}

const IC = "material-icons-outlined";

const ROLE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; desc: string }> = {
  ADMIN: { label: "Quản trị viên", icon: "admin_panel_settings", color: "text-orange-600", bg: "bg-orange-50 border-orange-200", desc: "Toàn quyền quản lý hệ thống" },
  LECTURER: { label: "Giảng viên", icon: "school", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", desc: "Quản lý lớp học & điểm danh" },
  STUDENT: { label: "Sinh viên", icon: "person", color: "text-green-600", bg: "bg-green-50 border-green-200", desc: "Tham gia lớp học & điểm danh" },
};

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
  const [showPassword, setShowPassword] = useState(false);

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
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi tạo tài khoản");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white transition";
  const selectedRole = ROLE_CONFIG[role];

  return (
    <AdminLayout
      title=""
      breadcrumb={[
        { path: "/admin/dashboard", label: "Trang chủ" },
        { path: "/admin/users", label: "Người dùng" },
        { label: "Tạo tài khoản" },
      ]}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
            <span className={IC} style={{ fontSize: 32, color: "white" }}>person_add</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Tạo tài khoản mới</h1>
          <p className="text-sm text-gray-500 mt-1">Thêm người dùng vào hệ thống quản lý điểm danh</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-10 h-10 rounded-full animate-spin mx-auto" style={{ border: "4px solid #FED7AA", borderTopColor: "#FF7043" }} />
            <p className="text-sm text-gray-400 mt-3">Đang tải...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Role selection */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <span className={IC} style={{ fontSize: 18, color: "#FF7043" }}>badge</span>
                Chọn vai trò
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((r) => {
                  const cfg = ROLE_CONFIG[r.name] || { label: r.name, icon: "person", color: "text-gray-600", bg: "bg-gray-50 border-gray-200", desc: "" };
                  const isActive = role === r.name;
                  return (
                    <button
                      key={r._id}
                      type="button"
                      onClick={() => setRole(r.name)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isActive
                          ? `${cfg.bg} border-current ring-2 ring-offset-1 ${cfg.color} shadow-sm`
                          : "bg-gray-50 border-gray-100 hover:border-gray-200 hover:bg-white"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute top-2 right-2">
                          <span className={`${IC} ${cfg.color}`} style={{ fontSize: 16 }}>check_circle</span>
                        </span>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? cfg.bg : "bg-gray-100"}`}>
                        <span className={`${IC} ${isActive ? cfg.color : "text-gray-400"}`} style={{ fontSize: 22 }}>{cfg.icon}</span>
                      </div>
                      <span className={`text-sm font-semibold ${isActive ? cfg.color : "text-gray-600"}`}>{cfg.label}</span>
                      <span className="text-xs text-gray-400 text-center leading-tight">{cfg.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info fields */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                <span className={IC} style={{ fontSize: 18, color: "#FF7043" }}>info</span>
                Thông tin cá nhân
              </label>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Họ và tên</label>
                  <div className="relative">
                    <span className={`${IC} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`} style={{ fontSize: 18 }}>person</span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`${inputCls} pl-10`}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <span className={`${IC} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`} style={{ fontSize: 18 }}>email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputCls} pl-10`}
                      placeholder="user@school.edu"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                <span className={IC} style={{ fontSize: 18, color: "#FF7043" }}>lock</span>
                Bảo mật
              </label>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mật khẩu</label>
                <div className="relative">
                  <span className={`${IC} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`} style={{ fontSize: 18 }}>key</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputCls} pl-10 pr-10`}
                    placeholder="Nhập mật khẩu"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <span className={IC} style={{ fontSize: 18 }}>{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`${IC} text-gray-300`} style={{ fontSize: 14 }}>info</span>
                  <span className="text-xs text-gray-400">Tối thiểu 6 ký tự</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4">
                <span className={IC} style={{ fontSize: 18 }}>error_outline</span>
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 px-4 py-3 rounded-xl mb-4">
                <span className={IC} style={{ fontSize: 18 }}>check_circle</span>
                Tạo tài khoản thành công!
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition shadow-md shadow-orange-200 text-sm"
              >
                <span className={IC} style={{ fontSize: 20 }}>{submitting ? "hourglass_empty" : "person_add"}</span>
                {submitting ? "Đang tạo..." : "Tạo tài khoản"}
              </button>
              <Link
                to="/admin/users"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition text-sm"
              >
                <span className={IC} style={{ fontSize: 18 }}>arrow_back</span>
                Quay lại
              </Link>
            </div>

            {/* Role preview */}
            {selectedRole && (
              <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border ${selectedRole.bg}`}>
                <span className={`${IC} ${selectedRole.color}`} style={{ fontSize: 20 }}>{selectedRole.icon}</span>
                <div>
                  <span className={`text-sm font-semibold ${selectedRole.color}`}>Vai trò: {selectedRole.label}</span>
                  <p className="text-xs text-gray-500">{selectedRole.desc}</p>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminCreateUser;
