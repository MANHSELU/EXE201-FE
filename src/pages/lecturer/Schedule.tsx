import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Footer from "../../components/Footer";

interface ScheduleSlot {
  _id: string;
  subjectId: {
    code: string;
    name: string;
  };
  classId: {
    name: string;
  };
  roomId: {
    name: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

const LecturerSchedule: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(null); // Selected day of month
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday;
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const slotsRes = await api.get("/lecturer/slots/upcoming");
      setSlots(slotsRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCode = (slotId: string) => {
    // Redirect sang trang tạo mã với slotId
    window.location.href = `/lecturer/attendance/generate?slotId=${slotId}`;
  };

  const handlePrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
    // Update month/year if needed
    setSelectedMonth(newStart.getMonth());
    setSelectedYear(newStart.getFullYear());
    setSelectedDate(null);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    // Update month/year if needed
    setSelectedMonth(newStart.getMonth());
    setSelectedYear(newStart.getFullYear());
    setSelectedDate(null);
  };

  const handleDateClick = (date: number, month: number, year: number) => {
    if (selectedDate === date && selectedMonth === month && selectedYear === year) {
      setSelectedDate(null); // Deselect if clicking same date
    } else {
      setSelectedDate(date);
      setSelectedMonth(month);
      setSelectedYear(year);
    }
  };

  // Generate week days from currentWeekStart
  const getWeekDays = () => {
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push({
        day: dayNames[date.getDay()],
        date: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        fullDate: date
      });
    }
    return days;
  };

  const weekDays = getWeekDays();
  const today = new Date();
  const weekStart = new Date(currentWeekStart);
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // Filter slots by selected date OR by current week
  const filteredSlots = slots.filter(slot => {
    const slotDate = new Date(slot.date);
    if (selectedDate !== null) {
      // Filter by specific selected date
      return slotDate.getDate() === selectedDate && 
             slotDate.getMonth() === selectedMonth && 
             slotDate.getFullYear() === selectedYear;
    } else {
      // Filter by current week
      return slotDate >= weekStart && slotDate <= weekEnd;
    }
  });

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
        .schedule-container {
          min-height: 100vh;
          background-color: #FFF8F5;
          padding: 2rem;
          display: flex;
          justify-content: center;
        }
        .main-content {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }
        .calendar-widget {
          background: white;
          border-radius: 24px;
          padding: 1.5rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          margin-bottom: 2rem;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }
        .week-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          text-align: center;
        }
        .day-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .day-item:hover .day-date {
          color: #FFAB91;
        }
        .day-name {
          font-size: 12px;
          font-weight: 500;
          color: #6B7280;
        }
        .day-date {
          font-size: 14px;
          font-weight: 600;
          color: #1F2937;
          transition: color 0.2s;
        }
        .day-today {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #FF7043;
          color: white;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 4px 15px rgba(255,112,67,0.4);
        }
        .timeline-section {
          position: relative;
        }
        .timeline-line {
          position: absolute;
          left: 6rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: #FFCCBC;
          z-index: 0;
        }
        .timeline-item {
          display: flex;
          width: 100%;
          margin-bottom: 2rem;
          position: relative;
        }
        .timeline-left {
          width: 96px;
          flex-shrink: 0;
          text-align: right;
          padding-right: 1.5rem;
          padding-top: 0.25rem;
        }
        .timeline-date {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          line-height: 1;
        }
        .timeline-day {
          font-size: 12px;
          font-weight: 500;
          color: #6B7280;
          margin-top: 0.25rem;
        }
        .timeline-slot {
          font-size: 14px;
          font-weight: 600;
          color: #1F2937;
        }
        .timeline-time {
          font-size: 10px;
          font-weight: 500;
          color: #6B7280;
        }
        .timeline-dot {
          width: 14px;
          height: 14px;
          background-color: #FF8A65;
          border-radius: 50%;
          position: absolute;
          left: 6rem;
          transform: translateX(-50%);
          z-index: 10;
          box-shadow: 0 0 0 4px #FFF8F5;
        }
        .timeline-card {
          flex-grow: 1;
          padding-left: 1.5rem;
        }
        .card-content {
          background: white;
          border-radius: 20px;
          padding: 1.25rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          transition: box-shadow 0.3s;
        }
        .card-content:hover {
          box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .room-text {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        .badge {
          font-size: 12px;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
        }
        .badge-upcoming {
          background: #E8F5E9;
          color: #2E7D32;
        }
        .badge-ended {
          background: #F3F4F6;
          color: #6B7280;
        }
        .subject-title {
          font-size: 18px;
          font-weight: 700;
          color: #FF7043;
          margin-bottom: 0.75rem;
        }
        .detail-item {
          font-size: 14px;
          color: #374151;
          margin-bottom: 0.25rem;
        }
        .materials-btn {
          background: linear-gradient(to right, #FFAB91, #FF7043);
          color: white;
          font-size: 14px;
          font-weight: 600;
          padding: 0.625rem 1.75rem;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(255,112,67,0.4);
          transition: all 0.2s;
        }
        .materials-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(255,112,67,0.5);
        }
        .empty-state {
          background: white;
          border-radius: 20px;
          padding: 3rem;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .nav-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background 0.2s;
        }
        .nav-btn:hover {
          background: #F3F4F6;
        }
        /* Header Styles */
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
        /* Day item selected state */
        .day-item.selected .day-date {
          color: #FF7043;
          font-weight: 700;
        }
        .day-selected {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #FFF3E0;
          color: #FF7043;
          font-weight: 700;
          font-size: 14px;
          border: 2px solid #FF7043;
        }
        .filter-info {
          background: #FFF3E0;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .filter-text {
          font-size: 14px;
          color: #FF7043;
          font-weight: 500;
        }
        .clear-filter-btn {
          font-size: 12px;
          color: #FF7043;
          background: white;
          border: 1px solid #FF7043;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .clear-filter-btn:hover {
          background: #FF7043;
          color: white;
        }
      `}</style>

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
            <a href="/lecturer/schedule" className="nav-link active">Schedule</a>
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

      <div className="schedule-container">
        {/* Main Container */}
        <main className="main-content">
          {/* Page Title */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', marginBottom: '0.25rem' }}>Teaching Schedule</h1>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>Manage your classes and track attendance</p>
          </div>

          {/* Calendar Widget */}
          <header className="calendar-widget">
            {/* Top Row */}
            <div className="calendar-header">
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>Current week:</h2>
                <p style={{ color: '#FF8A65', fontWeight: 600, marginTop: '0.25rem' }}>
                  {weekStart.getDate().toString().padStart(2, '0')}/{(weekStart.getMonth() + 1).toString().padStart(2, '0')}/{weekStart.getFullYear()} - {weekEnd.getDate().toString().padStart(2, '0')}/{(weekEnd.getMonth() + 1).toString().padStart(2, '0')}/{weekEnd.getFullYear()}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={handlePrevWeek} className="nav-btn" aria-label="Previous week">
                  <span className="material-icons-outlined" style={{ color: '#6B7280', fontSize: '20px' }}>chevron_left</span>
                </button>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#FF7043' }}>
                  {String(selectedMonth + 1).padStart(2, '0')}/{selectedYear}
                </div>
                <button onClick={handleNextWeek} className="nav-btn" aria-label="Next week">
                  <span className="material-icons-outlined" style={{ color: '#6B7280', fontSize: '20px' }}>chevron_right</span>
                </button>
              </div>
            </div>

            {/* Week Days Grid */}
            <nav className="week-grid">
              {weekDays.map((item, index) => {
                const isToday = item.fullDate.toDateString() === today.toDateString();
                const isSelected = selectedDate === item.date && selectedMonth === item.month && selectedYear === item.year;
                
                return (
                  <div 
                    key={index} 
                    className={`day-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDateClick(item.date, item.month, item.year)}
                  >
                    <span className="day-name">{item.day}</span>
                    {isToday && !isSelected ? (
                      <div className="day-today">{item.date}</div>
                    ) : isSelected ? (
                      <div className="day-selected">{item.date}</div>
                    ) : (
                      <span className="day-date">{item.date}</span>
                    )}
                  </div>
                );
              })}
            </nav>
          </header>

          {/* Filter Info */}
          {selectedDate !== null && (
            <div className="filter-info">
              <span className="filter-text">
                📅 Showing schedules for {selectedDate}/{selectedMonth + 1}/{selectedYear}
              </span>
              <button className="clear-filter-btn" onClick={() => setSelectedDate(null)}>
                Show all week
              </button>
            </div>
          )}

          {/* Timeline Section */}
          <section className="timeline-section">
            {/* Vertical Timeline Line */}
            {filteredSlots.length > 0 && <div className="timeline-line"></div>}

            {filteredSlots.length === 0 ? (
              <div className="empty-state">
                <span className="material-icons-outlined" style={{ color: '#D1D5DB', fontSize: '64px', marginBottom: '1rem', display: 'block' }}>event_busy</span>
                <p style={{ fontSize: '20px', fontWeight: 600, color: '#6B7280' }}>
                  {selectedDate !== null 
                    ? `Không có lịch dạy ngày ${selectedDate}/${selectedMonth + 1}` 
                    : 'Không có lịch dạy trong tuần này'}
                </p>
                <p style={{ color: '#9CA3AF', marginTop: '0.5rem' }}>
                  {selectedDate !== null 
                    ? 'Chọn ngày khác hoặc xem tất cả lịch trong tuần' 
                    : 'Chọn tuần khác để xem lịch dạy'}
                </p>
                {selectedDate !== null && (
                  <button 
                    className="clear-filter-btn" 
                    style={{ marginTop: '1rem' }}
                    onClick={() => setSelectedDate(null)}
                  >
                    Xem tất cả tuần này
                  </button>
                )}
              </div>
            ) : (
              filteredSlots.map((slot, index) => {
                const now = new Date();
                const slotDate = new Date(slot.date);
                const slotStart = new Date(`${slot.date}T${slot.startTime}`);
                const slotEnd = new Date(`${slot.date}T${slot.endTime}`);
                const isHappening = now >= slotStart && now <= slotEnd;
                const isPast = now > slotEnd;
                const dayNameEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][slotDate.getDay()];
                
                // Check if this is the first slot of a new day
                const isNewDay = index === 0 || new Date(filteredSlots[index - 1].date).getDate() !== slotDate.getDate();

                return (
                  <article key={slot._id} className="timeline-item">
                    {/* Left Column: Date & Time */}
                    <div className="timeline-left">
                      {/* Show date only for first slot of the day */}
                      {isNewDay && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div className="timeline-date">
                            {slotDate.getDate()}/{slotDate.getMonth() + 1}
                          </div>
                          <div className="timeline-day">{dayNameEn}</div>
                        </div>
                      )}
                      {/* Slot Time */}
                      <div>
                        <div className="timeline-slot">Slot: 3</div>
                        <div className="timeline-time">{slot.startTime} - {slot.endTime}</div>
                      </div>
                    </div>

                    {/* Center: Timeline Dot */}
                    <div className="timeline-dot" style={{ top: isNewDay ? '2.75rem' : '1.25rem' }}></div>

                    {/* Right Column: Class Card */}
                    <div className="timeline-card" style={{ marginTop: isNewDay ? '1.5rem' : '0' }}>
                      <div className="card-content">
                        {/* Header Row: Room & Badge */}
                        <div className="card-header">
                          <span className="room-text">Room: <strong>{slot.roomId.name}</strong></span>
                          {!isPast && (
                            <span className={`badge ${isHappening ? 'badge-upcoming' : 'badge-upcoming'}`}>
                              {isHappening ? 'present' : 'upcoming'}
                            </span>
                          )}
                          {isPast && (
                            <span className="badge badge-ended">ended</span>
                          )}
                        </div>

                        {/* Subject Code */}
                        <h3 className="subject-title">Subject Code: {slot.subjectId.code}</h3>

                        {/* Details List */}
                        <div>
                          <p className="detail-item">SessionNo: 5</p>
                          <p className="detail-item">Group class: {slot.classId.name}</p>
                          <p className="detail-item">Lecturer: HanhNT54</p>
                        </div>

                        {/* Create QRCode Button */}
                        {!isPast && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateCode(slot._id);
                              }}
                              className="materials-btn"
                            >
                              Create QRCode
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default LecturerSchedule;
