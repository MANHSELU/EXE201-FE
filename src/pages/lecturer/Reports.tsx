import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Footer from "../../components/Footer";

interface ClassInfo {
  _id: string;
  name: string;
  subjectCode: string;
  subjectName: string;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  slot: number;
  startTime: string;
  endTime: string;
  roomName: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

interface StudentAttendance {
  _id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  checkInTime: string | null;
  note: string;
}

const LecturerReports: React.FC = () => {
  const { user } = useAuth();
  
  // Filters
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>(""); // Local filter for history list
  
  // Data
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [studentAttendances, setStudentAttendances] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Filtered records based on date
  const filteredRecords = filterDate 
    ? attendanceRecords.filter(record => record.date === filterDate)
    : attendanceRecords;

  // Fetch classes that lecturer teaches
  useEffect(() => {
    // Mock classes - replace with API call: api.get('/lecturer/classes')
    setClasses([
      { _id: "1", name: "SE18C01", subjectCode: "DBI202", subjectName: "Database Introduction" },
      { _id: "2", name: "SE18C02", subjectCode: "PRJ301", subjectName: "Java Web Application" },
      { _id: "3", name: "SE18C03", subjectCode: "WDP301", subjectName: "Web Development Project" },
      { _id: "4", name: "CNTT K20", subjectCode: "DB202", subjectName: "Cơ sở dữ liệu" },
    ]);
  }, []);

  // Fetch attendance records when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchAttendanceRecords();
    } else {
      setAttendanceRecords([]);
      setSelectedRecord(null);
    }
  }, [selectedClass]);

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with real API
      // const res = await api.get(`/lecturer/reports?subject=${selectedSubject}&class=${selectedClass}&date=${selectedDate}`);
      
      // Mock data
      setTimeout(() => {
        setAttendanceRecords([
          {
            _id: "1",
            date: "2026-01-20",
            slot: 1,
            startTime: "07:30",
            endTime: "09:45",
            roomName: "A101",
            totalStudents: 35,
            presentCount: 30,
            absentCount: 3,
            lateCount: 2,
          },
          {
            _id: "2",
            date: "2026-01-22",
            slot: 3,
            startTime: "12:30",
            endTime: "14:45",
            roomName: "B202",
            totalStudents: 35,
            presentCount: 32,
            absentCount: 2,
            lateCount: 1,
          },
          {
            _id: "3",
            date: "2026-01-24",
            slot: 2,
            startTime: "09:50",
            endTime: "12:05",
            roomName: "A101",
            totalStudents: 35,
            presentCount: 28,
            absentCount: 5,
            lateCount: 2,
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchStudentAttendances = async (recordId: string) => {
    setDetailLoading(true);
    try {
      // Mock API call
      // const res = await api.get(`/lecturer/reports/${recordId}/students`);
      
      // Mock data
      setTimeout(() => {
        setStudentAttendances([
          { _id: "1", studentId: "s1", studentName: "Nguyễn Văn An", studentCode: "SE181234", status: "PRESENT", checkInTime: "07:35", note: "" },
          { _id: "2", studentId: "s2", studentName: "Trần Thị Bình", studentCode: "SE181235", status: "PRESENT", checkInTime: "07:32", note: "" },
          { _id: "3", studentId: "s3", studentName: "Lê Văn Cường", studentCode: "SE181236", status: "LATE", checkInTime: "07:55", note: "Đến muộn 25 phút" },
          { _id: "4", studentId: "s4", studentName: "Phạm Thị Dung", studentCode: "SE181237", status: "ABSENT", checkInTime: null, note: "" },
          { _id: "5", studentId: "s5", studentName: "Hoàng Văn Em", studentCode: "SE181238", status: "PRESENT", checkInTime: "07:28", note: "" },
          { _id: "6", studentId: "s6", studentName: "Ngô Thị Phương", studentCode: "SE181239", status: "PRESENT", checkInTime: "07:30", note: "" },
          { _id: "7", studentId: "s7", studentName: "Vũ Văn Giang", studentCode: "SE181240", status: "EXCUSED", checkInTime: null, note: "Có đơn xin phép" },
          { _id: "8", studentId: "s8", studentName: "Đỗ Thị Hoa", studentCode: "SE181241", status: "PRESENT", checkInTime: "07:33", note: "" },
          { _id: "9", studentId: "s9", studentName: "Bùi Văn Khánh", studentCode: "SE181242", status: "LATE", checkInTime: "08:00", note: "Đến muộn 30 phút" },
          { _id: "10", studentId: "s10", studentName: "Lý Thị Lan", studentCode: "SE181243", status: "PRESENT", checkInTime: "07:29", note: "" },
        ]);
        setDetailLoading(false);
      }, 300);
    } catch (err) {
      console.error(err);
      setDetailLoading(false);
    }
  };

  const handleViewDetail = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    fetchStudentAttendances(record._id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Có mặt</span>;
      case "ABSENT":
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Vắng</span>;
      case "LATE":
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Đi muộn</span>;
      case "EXCUSED":
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Có phép</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />

      <style>{`
        body { font-family: 'Poppins', sans-serif; }
        .report-container { min-height: 100vh; background: #FFF8F5; }
      `}</style>

      <div className="report-container">
        {/* Header */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #E5E7EB',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '0 1.5rem'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #FF7043, #FFAB91)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255,112,67,0.3)'
              }}>
                <span className="material-icons-outlined" style={{ color: 'white', fontSize: '24px' }}>school</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937' }}>Smart Attendance</span>
            </div>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <a href="/lecturer/dashboard" style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', textDecoration: 'none' }}>Dashboard</a>
              <a href="/lecturer/schedule" style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', textDecoration: 'none' }}>Schedule</a>
              <a href="/lecturer/reports" style={{ fontSize: '14px', fontWeight: 600, color: '#FF7043', textDecoration: 'none' }}>Attendance Report</a>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: 0 }}>{user?.fullName || 'Lecturer'}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Lecturer</p>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF7043, #FFAB91)',
                overflow: 'hidden'
              }}>
                <img src="https://i.pravatar.cc/150?img=12" alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* Page Title */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', marginBottom: '0.5rem' }}>Attendance Reports</h1>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>Xem báo cáo điểm danh các lớp bạn đang dạy</p>
          </div>

          {/* Class Filter */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            marginBottom: '2rem'
          }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
              <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: '#FF7043' }}>class</span>
              Chọn lớp học
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid #D1D5DB',
                background: '#F9FAFB',
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Chọn lớp học --</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.subjectCode} - {cls.name} ({cls.subjectName})
                </option>
              ))}
            </select>
          </div>

          {/* Content Area */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedRecord ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
            {/* Attendance Records List */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: 0 }}>
                  <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: '#FF7043' }}>history</span>
                  Lịch sử điểm danh
                  {filterDate && <span style={{ fontSize: '12px', fontWeight: 400, color: '#6B7280', marginLeft: '0.5rem' }}>({filteredRecords.length} kết quả)</span>}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      background: '#F9FAFB',
                      fontSize: '13px',
                      color: '#374151',
                      cursor: 'pointer'
                    }}
                  />
                  {filterDate && (
                    <button
                      onClick={() => setFilterDate("")}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Xóa filter"
                    >
                      <span className="material-icons-outlined" style={{ fontSize: '16px' }}>close</span>
                    </button>
                  )}
                </div>
              </div>

              {!selectedClass ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <span className="material-icons-outlined" style={{ fontSize: '64px', color: '#D1D5DB' }}>search</span>
                  <p style={{ color: '#6B7280', marginTop: '1rem' }}>Vui lòng chọn lớp học để xem báo cáo</p>
                </div>
              ) : loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid #FFAB91', borderTopColor: '#FF7043', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                  <p style={{ color: '#6B7280', marginTop: '1rem' }}>Đang tải...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <span className="material-icons-outlined" style={{ fontSize: '64px', color: '#D1D5DB' }}>event_busy</span>
                  <p style={{ color: '#6B7280', marginTop: '1rem' }}>
                    {filterDate ? 'Không có buổi điểm danh vào ngày này' : 'Không có dữ liệu điểm danh'}
                  </p>
                  {filterDate && (
                    <button
                      onClick={() => setFilterDate("")}
                      style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#FF7043',
                        color: 'white',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Xóa filter ngày
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredRecords.map((record) => (
                    <div
                      key={record._id}
                      onClick={() => handleViewDetail(record)}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: selectedRecord?._id === record._id ? '2px solid #FF7043' : '1px solid #E5E7EB',
                        background: selectedRecord?._id === record._id ? '#FFF7ED' : '#FAFAFA',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>{formatDate(record.date)}</p>
                          <p style={{ fontSize: '12px', color: '#6B7280' }}>Slot {record.slot} • {record.startTime} - {record.endTime}</p>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#E8F5E9',
                          color: '#2E7D32',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {record.roomName}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }}></span>
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>{record.presentCount} có mặt</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></span>
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>{record.absentCount} vắng</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }}></span>
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>{record.lateCount} muộn</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Detail Panel */}
            {selectedRecord && (
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
                    <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: '#FF7043' }}>people</span>
                    Chi tiết điểm danh
                  </h3>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.5rem'
                    }}
                  >
                    <span className="material-icons-outlined" style={{ color: '#6B7280' }}>close</span>
                  </button>
                </div>

                <div style={{
                  background: '#FFF7ED',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#FF7043', marginBottom: '0.25rem' }}>
                    {formatDate(selectedRecord.date)}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6B7280' }}>
                    Slot {selectedRecord.slot} • {selectedRecord.startTime} - {selectedRecord.endTime} • Phòng {selectedRecord.roomName}
                  </p>
                </div>

                {/* Summary */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: '#F0FDF4', borderRadius: '12px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#22C55E' }}>{selectedRecord.presentCount}</p>
                    <p style={{ fontSize: '10px', color: '#6B7280' }}>Có mặt</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: '#FEF2F2', borderRadius: '12px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444' }}>{selectedRecord.absentCount}</p>
                    <p style={{ fontSize: '10px', color: '#6B7280' }}>Vắng</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: '#FFFBEB', borderRadius: '12px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#F59E0B' }}>{selectedRecord.lateCount}</p>
                    <p style={{ fontSize: '10px', color: '#6B7280' }}>Muộn</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: '#F3F4F6', borderRadius: '12px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#6B7280' }}>{selectedRecord.totalStudents}</p>
                    <p style={{ fontSize: '10px', color: '#6B7280' }}>Tổng</p>
                  </div>
                </div>

                {/* Student List */}
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {detailLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <div style={{ width: '30px', height: '30px', border: '3px solid #FFAB91', borderTopColor: '#FF7043', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Sinh viên</th>
                          <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Trạng thái</th>
                          <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Check-in</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentAttendances.map((student) => (
                          <tr key={student._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <p style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937', margin: 0 }}>{student.studentName}</p>
                              <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>{student.studentCode}</p>
                            </td>
                            <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                              {getStatusBadge(student.status)}
                            </td>
                            <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem', fontSize: '12px', color: '#6B7280' }}>
                              {student.checkInTime || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Export Button */}
                <button style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #FF7043, #FFAB91)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <span className="material-icons-outlined" style={{ fontSize: '18px' }}>download</span>
                  Xuất báo cáo Excel
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default LecturerReports;
