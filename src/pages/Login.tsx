import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const [role, setRole] = useState<"STUDENT" | "LECTURER" | "ADMIN">("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { needsFaceRegister } = await login(email, password);
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userRole = (storedUser.role || "").toUpperCase();
      
      console.log("[Login] Role:", userRole, "needsFaceRegister:", needsFaceRegister);
      
      if (userRole === "STUDENT") {
        if (needsFaceRegister) {
          console.log("[Login] Redirecting to face-register...");
          navigate("/student/face-register", { 
            state: { message: "Vui lòng đăng ký khuôn mặt để sử dụng hệ thống điểm danh" } 
          });
        } else {
          console.log("[Login] Has face data, going to dashboard...");
          navigate("/student/dashboard");
        }
      } else if (userRole === "LECTURER") {
        navigate("/lecturer/dashboard");
      } else if (userRole === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        setError("Vai trò không hợp lệ. Liên hệ quản trị viên.");
        setLoading(false);
        return;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message;
      if (err.code === "ERR_NETWORK" || err.message?.includes("Network Error")) {
        setError("Không kết nối được server. Kiểm tra backend đã chạy chưa và đúng địa chỉ trong file .env (VITE_API_URL).");
      } else {
        setError(msg || "Đăng nhập thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
        rel="stylesheet"
      />

      <style>{`
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex flex-col">
        {/* Header */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="material-icons-outlined text-white text-2xl">school</span>
              </div>
              <span className="text-xl font-bold text-gray-800">SmartAttendance</span>
            </div>

            <div className="flex items-center space-x-8 text-sm">
              <a href="#" className="text-gray-600 hover:text-orange-500 transition">Hướng dẫn</a>
              <a href="#" className="text-gray-600 hover:text-orange-500 transition">Hỗ trợ</a>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <span className="material-icons-outlined text-gray-600">dark_mode</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            {/* Form Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Chào mừng trở lại</h1>
                <p className="text-gray-500">Đăng nhập để tiếp tục quản lý học tập</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vai trò của bạn
                  </label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as "STUDENT" | "LECTURER" | "ADMIN")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                    >
                      <option value="STUDENT">Học sinh / Sinh viên</option>
                      <option value="LECTURER">Giảng viên</option>
                      <option value="ADMIN">Quản trị viên</option>
                    </select>
                    <span className="material-icons-outlined absolute right-3 top-3 text-gray-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên đăng nhập
                  </label>
                  <div className="relative">
                    <span className="material-icons-outlined absolute left-3 top-3 text-gray-400">
                      person_outline
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập mã số hoặc email"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
                    <a href="#" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
                      Quên mật khẩu?
                    </a>
                  </div>
                  <div className="relative">
                    <span className="material-icons-outlined absolute left-3 top-3 text-gray-400">
                      lock_outline
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      <span className="material-icons-outlined">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
                </button>

                {/* Google Login */}
                <button
                  type="button"
                  className="w-full flex items-center justify-center space-x-3 border border-gray-300 rounded-xl py-3 hover:bg-gray-50 transition font-medium text-gray-700"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Đăng nhập với Google</span>
                </button>
              </form>

              {/* Footer */}
              <div className="text-center mt-6 text-sm text-gray-500">
                Bạn chưa có tài khoản?{" "}
                <a href="#" className="text-orange-500 hover:text-orange-600 font-semibold">
                  Liên hệ quản trị viên
                </a>
              </div>
            </div>

            <div className="text-center mt-8 text-sm text-gray-400">
              © 2024 Smart Attendance System. All rights reserved.
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Login;
