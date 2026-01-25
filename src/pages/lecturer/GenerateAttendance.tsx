import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Footer from "../../components/Footer";

const GenerateAttendance: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const slotId = searchParams.get("slotId");

  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [attendanceCode, setAttendanceCode] = useState("");
  const [, setSessionId] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const DURATION_MINUTES = 5; // Fixed 5 minutes

  useEffect(() => {
    fetchSlots();
  }, []);

  useEffect(() => {
    if (slotId) {
      setSelectedSlot(slotId);
    }
  }, [slotId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const fetchSlots = async () => {
    try {
      const res = await api.get("/lecturer/slots/upcoming");
      setSlots(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateCode = async () => {
    if (!selectedSlot) {
      alert("Vui lòng chọn lớp học");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/lecturer/attendance/createQrCode", {
        slotId: selectedSlot,
      });

      const { code, attendanceSessionId } = res.data.data;
      setAttendanceCode(code);
      setSessionId(attendanceSessionId);
      setTimeLeft(DURATION_MINUTES * 60);
    } catch (err: any) {
      alert(err.response?.data?.message || "Tạo mã thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Get selected slot data for display if needed
  const _selectedSlotData = slots.find((s) => s._id === selectedSlot);
  void _selectedSlotData; // Suppress unused warning

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
        rel="stylesheet"
      />

      <style>{`
        body { font-family: 'Poppins', sans-serif; }
        .header-nav {
          background: white;
          border-bottom: 1px solid #E5E7EB;
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 0 1.5rem;
        }
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #FF7043, #FFAB91);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(255,112,67,0.3);
        }
        .logo-text {
          font-size: 18px;
          font-weight: 700;
          color: #1F2937;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .nav-link {
          font-size: 14px;
          font-weight: 500;
          color: #6B7280;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: #FF7043;
        }
        .nav-link.active {
          color: #FF7043;
          font-weight: 600;
        }
        .user-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .notification-btn {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background 0.2s;
        }
        .notification-btn:hover {
          background: #F3F4F6;
        }
        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #FF7043;
          border-radius: 50%;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-left: 1rem;
          border-left: 1px solid #E5E7EB;
        }
        .user-details {
          text-align: right;
        }
        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: #1F2937;
        }
        .user-role {
          font-size: 12px;
          color: #6B7280;
        }
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF7043, #FFAB91);
          overflow: hidden;
        }
        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#FFF8F5' }}>
        {/* Header Navigation */}
        <header className="header-nav">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon">
                <span className="material-icons-outlined" style={{ color: 'white', fontSize: '24px' }}>school</span>
              </div>
              <span className="logo-text">Smart Attendance</span>
            </div>

            <nav className="nav-links">
              <a href="/lecturer/dashboard" className="nav-link">Dashboard</a>
              <a href="/lecturer/schedule" className="nav-link">Schedule</a>
              <a href="/lecturer/reports" className="nav-link">Attendance Report</a>
            </nav>

            <div className="user-section">
              <button className="notification-btn">
                <span className="material-icons-outlined" style={{ color: '#6B7280', fontSize: '24px' }}>notifications</span>
                <span className="notification-dot"></span>
              </button>
              <div className="user-info">
                <div className="user-details">
                  <p className="user-name">{user?.fullName || 'Lecturer'}</p>
                  <p className="user-role">Lecturer</p>
                </div>
                <div className="user-avatar">
                  <img src="https://i.pravatar.cc/150?img=12" alt="Avatar" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-6xl mx-auto px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Generate Attendance Code</h1>
            <p className="text-gray-500">Select a class session to create a unique check-in code for your students.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel - Settings */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center space-x-2">
                <span className="material-icons-outlined text-orange-500">school</span>
                <span>Select Class</span>
              </h3>

              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 mb-6"
              >
                <option value="">-- Chọn lớp học --</option>
                {slots.map((slot) => (
                  <option key={slot._id} value={slot._id}>
                    {slot.subjectId.code} - {slot.subjectId.name} ({slot.startTime})
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerateCode}
                disabled={loading || !selectedSlot}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span className="material-icons-outlined">qr_code_2</span>
                <span>{loading ? "Đang tạo..." : "Tạo mã điểm danh"}</span>
              </button>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
                <span className="material-icons-outlined text-blue-500 text-xl">info</span>
                <p className="text-sm text-blue-700">
                  <strong>Students must be connected to the university Wi-Fi network to check in successfully.</strong>
                </p>
              </div>
            </div>

            {/* Right Panel - QR Display */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 flex flex-col">
              {attendanceCode ? (
                <>
                  <div className="text-center mb-6">
                    <span className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-600 rounded-full text-sm font-bold uppercase tracking-wide">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>● Live Session Active</span>
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold text-orange-500 mb-2 tracking-wider flex items-center space-x-2">
                      {attendanceCode.split("").map((char, idx) => (
                        <span key={idx} className="inline-block bg-orange-100 px-3 py-2 rounded-xl shadow-md">
                          {char}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mb-6 font-medium">Mã điểm danh</p>

                    <div className="relative w-28 h-28 mb-4">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="50"
                          stroke="#f3f4f6"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="50"
                          stroke="#f97316"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(timeLeft / (DURATION_MINUTES * 60)) * 314.16} 314.16`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{formatTime(timeLeft)}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Time Left</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(attendanceCode);
                        alert("Đã copy mã!");
                      }}
                      className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center space-x-2"
                    >
                      <span className="material-icons-outlined">content_copy</span>
                      <span>Copy</span>
                    </button>
                    <button 
                      onClick={() => {
                        const elem = document.documentElement;
                        if (elem.requestFullscreen) {
                          elem.requestFullscreen();
                        }
                      }}
                      className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center space-x-2"
                    >
                      <span className="material-icons-outlined">fullscreen</span>
                      <span>Fullscreen</span>
                    </button>
                    <button
                      onClick={handleGenerateCode}
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <span className="material-icons-outlined">refresh</span>
                      <span>{loading ? "..." : "Tạo lại"}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
                  <span className="material-icons-outlined text-8xl mb-4">qr_code_2</span>
                  <p className="text-lg font-semibold text-gray-600">No Active Session</p>
                  <p className="text-sm">Generate a code to display QR</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 mb-6 text-lg">RECENT SESSIONS</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-800">CS101 - Intro to CS</h4>
                  <span className="material-icons-outlined text-green-500">arrow_forward</span>
                </div>
                <p className="text-xs text-gray-500">Yesterday, 08:00 AM • 45/48 Present</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-800">CS202 - Data Structures</h4>
                  <span className="material-icons-outlined text-green-500">arrow_forward</span>
                </div>
                <p className="text-xs text-gray-500">Oct 24, 10:00 AM • 32/35 Present</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default GenerateAttendance;
