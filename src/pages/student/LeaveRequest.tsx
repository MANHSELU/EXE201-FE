import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "../../services/api";
import Footer from "../../components/Footer";
import StudentHeader from "../../components/StudentHeader";

interface ScheduleSlot {
  _id: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  subjectId: {
    code: string;
    name: string;
  };
  classId: {
    name: string;
  };
}

interface LeaveRequest {
  _id: string;
  slotId: ScheduleSlot;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  proofImageUrl?: string;
  requestDate: string;
  responseDate?: string;
  responseNote?: string;
}

const LeaveRequest: React.FC = () => {
  const [upcomingSlots, setUpcomingSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reason, setReason] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUpcomingSlots();
  }, []);

  const fetchUpcomingSlots = async () => {
    try {
      setLoading(true);
      const res = await api.get("/student/slots/available-for-leave");
      const slots = res.data.data || [];
      setUpcomingSlots(slots);
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLeaveRequest = async () => {
    if (!selectedSlot || !reason.trim()) {
      setMessage("Please select a slot and provide a reason");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("slotId", selectedSlot._id);
      formData.append("reason", reason.trim());
      if (proofImage) {
        formData.append("proofImage", proofImage);
      }

      // Let axios handle multipart/form-data automatically
      await api.post("/student/leave-request", formData);

      setMessage("Leave request submitted successfully!");
      setReason("");
      setProofImage(null);
      setImagePreview(null);
      setSelectedSlot(null);
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImage(file);
      // Preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDateChange = (date: any) => {
    if (Array.isArray(date)) {
      setSelectedDate(date[0]);
    } else if (date instanceof Date) {
      setSelectedDate(date);
    } else {
      setSelectedDate(null);
    }
  };

  const handleRemoveProofImage = () => {
    setProofImage(null);
    setImagePreview(null);
  };

  // Filter slots theo ngày được chọn
  const filteredSlots = selectedDate
    ? upcomingSlots.filter((slot) => {
        // slot.date format: "2026-03-11" (string) hoặc Date object
        // selectedDate: Date object
        const selectedDateStr = selectedDate.toISOString().split("T")[0];
        const slotDateStr = typeof slot.date === "string"
          ? slot.date.split("T")[0]
          : slot.date.toISOString().split("T")[0];
        return selectedDateStr === slotDateStr;
      })
    : [];

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
        
        /* React Calendar Customization */
        .react-calendar-custom {
          font-family: 'Poppins', sans-serif;
          background: white;
          border: none;
          border-radius: 12px;
        }
        
        .react-calendar-custom .react-calendar__month-view__days__day--weekend {
          color: #f97316;
        }
        
        .react-calendar-custom .react-calendar__tile--now {
          background-color: #fef3c7;
          font-weight: bold;
        }
        
        .react-calendar-custom .react-calendar__tile--active {
          background: linear-gradient(to right, #f97316, #f97316);
          color: white;
        }
        
        .react-calendar-custom .react-calendar__tile:enabled:hover,
        .react-calendar-custom .react-calendar__tile:enabled:focus {
          background-color: #fed7aa;
          border-radius: 8px;
        }
        
        .react-calendar-custom .react-calendar__tile--disabled {
          background-color: #f3f4f6;
          color: #d1d5db;
          cursor: not-allowed;
        }
        
        .react-calendar-custom .react-calendar__navigation button {
          color: #1f2937;
          font-weight: 600;
        }
        
        .react-calendar-custom .react-calendar__month-view__weekdays__weekday {
          color: #6b7280;
          font-weight: 600;
        }
      `}</style>

      <div style={{ minHeight: "100vh", backgroundColor: "#FFF8F5" }}>
        <StudentHeader />

        <main className="max-w-6xl mx-auto px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Request Leave</h1>
            <p className="text-gray-500">Submit a leave request for your upcoming classes</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl ${message.includes("successfully") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 gap-8">
            {/* Request Form */}
            <div>
              <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 max-w-3xl mx-auto">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center space-x-2">
                  <span className="material-icons-outlined text-orange-500">event_busy</span>
                  <span>Submit Leave Request</span>
                </h3>

                <div className="space-y-8">
                  {/* STEP 1: Date Selection */}
                  <div className="border-b pb-6">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                      <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
                      <span>Chọn Ngày</span>
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 inline-block">
                      <Calendar
                        value={selectedDate}
                        onChange={handleDateChange}
                        minDate={new Date()}
                        className="react-calendar-custom"
                      />
                    </div>
                    {selectedDate && (
                      <p className="text-sm text-gray-600 mt-3">
                        Đã chọn: <strong>{selectedDate.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" })}</strong>
                      </p>
                    )}
                  </div>

                  {/* STEP 2: Class Selection (only show if date selected) */}
                  {selectedDate && (
                    <div className="border-b pb-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                        <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
                        <span>Chọn Lớp Học</span>
                      </h4>
                      {loading ? (
                        <p className="text-gray-500">Đang tải dữ liệu...</p>
                      ) : filteredSlots.length === 0 ? (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                          <p className="text-yellow-800 font-semibold">📅 Ngày này bạn không có lớp</p>
                          <p className="text-sm text-yellow-700 mt-1">Vui lòng chọn một ngày khác</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredSlots.map((slot) => (
                            <div
                              key={slot._id}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                                selectedSlot?._id === slot._id
                                  ? "border-orange-500 bg-orange-50"
                                  : "border-gray-200 hover:border-orange-300"
                              }`}
                            >
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {slot.subjectId.code} - {slot.subjectId.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {slot.startTime} - {slot.endTime}
                                </p>
                                <p className="text-xs text-gray-500">{slot.classId.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 3: Reason (only show if slot selected) */}
                  {selectedSlot && (
                    <div className="border-b pb-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                        <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
                        <span>Lý Do Xin Vắng</span>
                      </h4>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Vui lòng giải thích lý do bạn cần xin vắng..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        rows={4}
                      />
                    </div>
                  )}

                  {/* STEP 4: Proof Image (only show if slot selected) */}
                  {selectedSlot && (
                    <div className="border-b pb-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                        <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
                        <span>Ảnh Bằng Chứng (Tùy Chọn)</span>
                      </h4>
                      <p className="text-xs text-gray-500 mb-3">
                        Tải lên ảnh để chứng minh (ốm đau, sự cố) - JPG, PNG, GIF, WebP - Max 5MB
                      </p>
                      
                      {!imagePreview ? (
                        <label className="relative flex flex-col items-center justify-center w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition">
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            <span className="material-icons-outlined text-gray-400 text-4xl mb-2">image</span>
                            <p className="text-sm text-gray-600">Nhấp để tải lên hoặc kéo thả</p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleProofImageChange}
                          />
                        </label>
                      ) : (
                        <div className="space-y-3">
                          <div className="rounded-xl overflow-hidden border border-gray-200">
                            <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 px-4 py-2 text-sm border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition"
                            >
                              Thay Ảnh
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveProofImage}
                              className="flex-1 px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                            >
                              Xóa Ảnh
                            </button>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleProofImageChange}
                          />
                          <p className="text-xs text-gray-600">File: {proofImage?.name}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  {selectedSlot && (
                    <button
                      onClick={handleSubmitLeaveRequest}
                      disabled={!reason.trim() || submitting}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg"
                    >
                      <span className="material-icons-outlined">send</span>
                      <span>{submitting ? "Đang gửi..." : "Gửi Đơn Xin Vắng"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default LeaveRequest;
