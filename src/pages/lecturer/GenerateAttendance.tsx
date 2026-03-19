import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Footer from "../../components/Footer";
import LecturerHeader from "../../components/LecturerHeader";

const GenerateAttendance: React.FC = () => {
  useAuth();
  const [searchParams] = useSearchParams();
  const slotId = searchParams.get("slotId");

  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [attendanceCode, setAttendanceCode] = useState("");
  const [, setSessionId] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [endTime, setEndTime] = useState<Date | null>(null);
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
    if (endTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
        setTimeLeft(remaining);
        
        // Stop timer khi còn 0 giây
        if (remaining === 0) {
          clearInterval(timer);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [endTime]);

  const fetchSlots = async () => {
    try {
      const res = await api.get("/lecturer/slots/upcoming");
      setSlots(res.data.data || []);
    } catch (err) {
      // Lỗi khi tải danh sách slot
    }
  };

  const handleGenerateCode = async () => {
    if (!selectedSlot) {
      alert("Không thể tạo mã. Vui lòng quay lại và chọn lớp học từ lịch dạy");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/lecturer/attendance/createQrCode", {
        slotId: selectedSlot,
      });

      const { code, attendanceSessionId, endTime: backendEndTime } = res.data.data;
      setAttendanceCode(code);
      setSessionId(attendanceSessionId);
      
      // Chuyển endTime từ string sang Date object
      if (!backendEndTime) {
        console.warn("Backend did not return endTime. Using 5 minutes as fallback.");
        const now = new Date();
        const expiryDate = new Date(now.getTime() + 5 * 60 * 1000);
        setEndTime(expiryDate);
        setTimeLeft(300);
      } else {
        const expiryDate = new Date(backendEndTime);
        setEndTime(expiryDate);
        
        // Tính timeLeft ngay khi nhận response
        const now = new Date();
        const remaining = Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / 1000));
        setTimeLeft(remaining);
      }
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
    // Handle invalid input
    if (isNaN(seconds) || seconds < 0) {
      return "00:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
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
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#FFF8F5' }}>
        <LecturerHeader />

        {/* Main */}
        <main className="max-w-7xl mx-auto px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Tạo mã điểm danh cho buổi học</h1>
            <p className="text-gray-500">Tạo mã điểm danh cho học sinh để điểm danh cho buổi học</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Panel - Class Info */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center space-x-2">
                <span className="material-icons-outlined text-orange-500">school</span>
                <span>Thông tin lớp</span>
              </h3>

              {selectedSlot && slots.length > 0 ? (
                <>
                  {(() => {
                    const selectedSlotData = slots.find((s) => s._id === selectedSlot);
                    if (!selectedSlotData) return null;
                    
                    return (
                      <div className="space-y-4 mb-6">
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4">
                          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Mã môn học</p>
                          <p className="text-2xl font-bold text-orange-700">{selectedSlotData.subjectId.code}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-2xl p-4">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Tên môn học</p>
                          <p className="text-lg font-semibold text-gray-800">{selectedSlotData.subjectId.name}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Lớp</p>
                            <p className="text-base font-semibold text-gray-800">{selectedSlotData.classId.name}</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Phòng</p>
                            <p className="text-base font-semibold text-gray-800">{selectedSlotData.roomId.name}</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-2xl p-4">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Thời gian</p>
                          <p className="text-base font-semibold text-gray-800">
                            {selectedSlotData.startTime} - {selectedSlotData.endTime}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <button
                    onClick={handleGenerateCode}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <span className="material-icons-outlined">qr_code_2</span>
                    <span>{loading ? "Đang tạo..." : "Tạo mã điểm danh"}</span>
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <span className="material-icons-outlined text-4xl text-gray-300 mb-3">info</span>
                  <p className="text-gray-500 font-medium">Vui lòng chọn lớp từ lịch dạy</p>
                </div>
              )}
            </div>

            {/* Right Panel - QR Display */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 flex flex-col">
              {attendanceCode ? (
                <>
                  <div className="text-center mb-6">
                    <span className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-600 rounded-full text-sm font-bold uppercase tracking-wide">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>Mã điểm danh hiện tại</span>
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
                  <p className="text-lg font-semibold text-gray-600">Chưa có hoạt động</p>
                  <p className="text-sm">Tạo mã để hiển thị mã điểm danh</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default GenerateAttendance;
