import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import Footer from "../../components/Footer";

const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const slotId = searchParams.get("slotId");
  const sessionId = searchParams.get("sessionId");
  const slotInfo = searchParams.get("subject") || "Cơ Sở Dữ Liệu - DS302";

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[A-Z0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 ký tự");
      return;
    }

    if (!slotId || !sessionId) {
      setError("Thiếu thông tin slot hoặc session");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Giả lập face confidence (trong thực tế sẽ từ camera/AI service)
      const faceConfidence = faceDetected ? 0.92 : 0;

      await api.post("/student/attendance/checkin", {
        slotId,
        attendanceSessionId: sessionId,
        code: fullCode,
        faceImageUrl: "", // URL ảnh từ camera nếu có
        faceConfidence,
      });

      alert("Điểm danh thành công!");
      navigate("/student/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Điểm danh thất bại");
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

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        {/* Nav */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="material-icons-outlined text-white text-2xl">school</span>
              </div>
              <span className="text-xl font-bold text-gray-800">SmartEdu</span>
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <a href="/student/dashboard" className="text-gray-600 hover:text-orange-500">Trang chủ</a>
              <a href="/student/schedule" className="text-orange-500 font-medium">Lịch học</a>
              <a href="/student/report" className="text-gray-600 hover:text-orange-500">Báo cáo điểm danh</a>
              <div className="flex items-center space-x-3 pl-6 border-l border-gray-200">
                <span className="material-icons-outlined text-gray-400">notifications</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">{user?.fullName}</span>
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                    {user?.fullName?.charAt(0) || "N"}
                  </div>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded-lg">
                  <span className="material-icons-outlined text-gray-400">logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="bg-white rounded-3xl shadow-2xl p-10">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Tiến Hành Điểm Danh</h1>

            {/* Camera Box */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 mb-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent"></div>
              <div className="relative aspect-video flex items-center justify-center">
                {!cameraActive ? (
                  <button
                    onClick={() => setCameraActive(true)}
                    className="flex flex-col items-center space-y-3 text-white"
                  >
                    <span className="material-icons-outlined text-6xl">videocam</span>
                    <span className="font-medium">Bật camera để xác thực</span>
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="relative">
                      <div className="w-48 h-64 border-4 border-white/30 rounded-2xl flex items-center justify-center">
                        <span className="material-icons-outlined text-white text-8xl">face</span>
                      </div>
                      <div className="absolute inset-x-0 top-1/2 h-1 bg-orange-500 shadow-lg shadow-orange-500/50"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-sm bg-black/50 px-4 py-2 rounded-lg mt-72">
                          Align your face within the frame
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Code Input */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Nhập mã 6 ký tự</h3>
                <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-medium">
                  {slotInfo}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Mã được cung cấp bởi giảng viên</p>

              <div className="flex items-center justify-between space-x-3">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-16 h-20 text-center text-3xl font-bold border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm"
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !cameraActive}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang xác thực..." : "Xác thực"}
            </button>
          </div>

          {/* Help */}
          <div className="text-center mt-6 text-sm text-gray-500">
            <span className="material-icons-outlined text-base align-middle mr-1">info</span>
            Bạn gặp sự cố?{" "}
            <a href="#" className="text-orange-500 hover:text-orange-600 font-medium">
              Liên hệ hỗ trợ
            </a>
          </div>

          <div className="text-center mt-4 text-xs text-gray-400">Phiên bản 2.4.1</div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default StudentAttendance;
