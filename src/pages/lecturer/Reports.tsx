import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Footer from "../../components/Footer";
import LecturerHeader from "../../components/LecturerHeader";

interface ClassInfo {
  classId: string;
  className: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
}

interface AttendanceRecord {
  _id: string;
  sessionId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  roomName: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  hasAttendance: boolean;
}

interface StudentAttendance {
  _id: string;
  studentName: string;
  studentCode: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "INVALID_LOCATION";
  checkInTime: string | null;
  note: string;
}

const LecturerReports: React.FC = () => {
  useAuth();

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [, setSelectedSubject] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [studentAttendances, setStudentAttendances] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const filteredRecords = filterDate
    ? attendanceRecords.filter(record => {
        const recordDate = new Date(record.date).toISOString().split("T")[0];
        return recordDate === filterDate;
      })
    : attendanceRecords;

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/lecturer/reports/classes");
        setClasses(res.data.data || []);
      } catch { setClasses([]); }
    })();
  }, []);

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
      const cls = classes.find(c => c.classId === selectedClass);
      const url = `/lecturer/reports/sessions?classId=${selectedClass}${cls ? `&subjectId=${cls.subjectId}` : ""}`;
      const res = await api.get(url);
      setAttendanceRecords(res.data.data || []);
    } catch { setAttendanceRecords([]); }
    finally { setLoading(false); }
  };

  const fetchStudentAttendances = async (sessionId: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/lecturer/reports/sessions/${sessionId}/students`);
      setStudentAttendances(res.data.data || []);
    } catch { setStudentAttendances([]); }
    finally { setDetailLoading(false); }
  };

  const handleViewDetail = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    if (record.sessionId) {
      fetchStudentAttendances(record.sessionId);
    } else {
      setStudentAttendances([]);
    }
  };

  const handleSelectClass = (value: string) => {
    setSelectedClass(value);
    const cls = classes.find(c => c.classId === value);
    setSelectedSubject(cls?.subjectId || "");
    setSelectedRecord(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Có mặt</span>;
      case "ABSENT":
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Vắng</span>;
      case "LATE":
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Đi muộn</span>;
      case "INVALID_LOCATION":
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Sai vị trí</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Tính tổng thống kê
  const totalSessions = attendanceRecords.length;
  const attendedSessions = attendanceRecords.filter(r => r.hasAttendance).length;
  const avgPresent = attendedSessions > 0
    ? Math.round(attendanceRecords.filter(r => r.hasAttendance).reduce((sum, r) => sum + (r.totalStudents > 0 ? (r.presentCount / r.totalStudents) * 100 : 0), 0) / attendedSessions)
    : 0;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />

      <style>{`
        body { font-family: 'Poppins', sans-serif; }
        .report-container { min-height: 100vh; background: #FFF8F5; }
      `}</style>

      <div className="report-container">
        <LecturerHeader />

        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', marginBottom: '0.5rem' }}>Báo cáo điểm danh</h1>
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
              onChange={(e) => handleSelectClass(e.target.value)}
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
                <option key={`${cls.classId}_${cls.subjectId}`} value={cls.classId}>
                  {cls.subjectCode} - {cls.className} ({cls.subjectName})
                </option>
              ))}
            </select>
          </div>

          {/* Summary stats */}
          {selectedClass && !loading && attendanceRecords.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#FF7043' }}>{totalSessions}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '0.25rem' }}>Tổng buổi học</p>
              </div>
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#22C55E' }}>{attendedSessions}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '0.25rem' }}>Đã điểm danh</p>
              </div>
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#3B82F6' }}>{avgPresent}%</p>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '0.25rem' }}>TB có mặt</p>
              </div>
            </div>
          )}

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
                      onClick={() => record.hasAttendance ? handleViewDetail(record) : undefined}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: selectedRecord?._id === record._id ? '2px solid #FF7043' : '1px solid #E5E7EB',
                        background: !record.hasAttendance ? '#F9FAFB' : selectedRecord?._id === record._id ? '#FFF7ED' : '#FAFAFA',
                        cursor: record.hasAttendance ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        opacity: record.hasAttendance ? 1 : 0.7,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>{formatDate(record.date)}</p>
                          <p style={{ fontSize: '12px', color: '#6B7280' }}>{record.startTime} - {record.endTime}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                          {!record.hasAttendance && (
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              background: '#FEF3C7',
                              color: '#92400E',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              Chưa điểm danh
                            </span>
                          )}
                        </div>
                      </div>

                      {record.hasAttendance && (
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
                      )}
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
                    {selectedRecord.startTime} - {selectedRecord.endTime} &bull; Phòng {selectedRecord.roomName}
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
                  ) : !selectedRecord.hasAttendance ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      <span className="material-icons-outlined" style={{ fontSize: '48px', color: '#D1D5DB' }}>qr_code_2</span>
                      <p style={{ marginTop: '0.5rem', fontSize: '14px' }}>Buổi này chưa được điểm danh</p>
                    </div>
                  ) : studentAttendances.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      <p>Chưa có sinh viên nào trong lớp</p>
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
