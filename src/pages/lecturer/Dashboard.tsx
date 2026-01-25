import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Footer from "../../components/Footer";

interface Slot {
  _id: string;
  subjectId: { code: string; name: string };
  classId: { name: string };
  roomId: { name: string };
  date: string;
  startTime: string;
  endTime: string;
}

const LecturerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingSlots, setUpcomingSlots] = useState<Slot[]>([]);
  const [totalClasses, setTotalClasses] = useState(3);
  const [avgAttendance, setAvgAttendance] = useState(85);

  useEffect(() => {
    fetchUpcomingSlots();
  }, []);

  const fetchUpcomingSlots = async () => {
    try {
      const res = await api.get("/lecturer/slots/upcoming");
      setUpcomingSlots(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const nextSlot = upcomingSlots[0];
  const timeUntilNext = nextSlot
    ? Math.floor((new Date(nextSlot.date).getTime() - Date.now()) / 60000)
    : 0;

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
              <a href="/lecturer/dashboard" className="nav-link active">Dashboard</a>
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
        <main className="max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">OCTOBER 24, 2023</p>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Good Morning, <span className="text-orange-500">Dr. Smith</span>
            </h1>
            <p className="text-gray-600">
              You have <span className="font-semibold text-orange-500">{upcomingSlots.length} sessions</span> scheduled for today.
              {nextSlot && ` The next one starts in ${timeUntilNext} minutes.`}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Stats + Upcoming */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="material-icons-outlined text-blue-600 text-3xl">school</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Total Classes</p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-gray-800">{totalClasses}</p>
                        <span className="text-xs text-gray-400">Today</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                      <span className="material-icons-outlined text-green-600 text-3xl">people</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Avg. Attendance</p>
                      <div className="flex items-center justify-between">
                        <p className="text-3xl font-bold text-gray-800">{avgAttendance}%</p>
                        <span className="text-xs text-green-600 font-semibold">↑ +2.4%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Classes */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Upcoming Classes</h2>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <span className="material-icons-outlined text-gray-400">calendar_view_day</span>
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <span className="material-icons-outlined text-gray-400">view_list</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {upcomingSlots.slice(0, 3).map((slot, idx) => (
                    <div
                      key={idx}
                      className="border-l-4 border-orange-500 bg-orange-50/30 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                              {idx === 0 ? "● Happening Now" : "START"}
                            </span>
                            <span className="text-sm font-bold text-gray-800">
                              {slot.startTime}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-800 text-lg mb-2">
                            {slot.subjectId.name} <span className="text-orange-500">({slot.subjectId.code})</span>
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <span className="material-icons-outlined text-base">place</span>
                              <span>{slot.roomId.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="material-icons-outlined text-base">people</span>
                              <span>45 Students</span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={`/lecturer/attendance/generate?slotId=${slot._id}`}
                          className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition"
                        >
                          View Details
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href="/lecturer/schedule"
                  className="block text-center text-orange-600 hover:text-orange-700 font-semibold mt-6"
                >
                  View Full Schedule →
                </a>
              </div>
            </div>

            {/* Quick Action */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-icons-outlined text-3xl">flash_on</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Quick Action</h3>
                <p className="text-orange-100 text-sm mb-6">
                  Instantly generate a QR code for your current class session.
                </p>
                <a
                  href="/lecturer/attendance/generate"
                  className="block w-full bg-white text-orange-600 font-bold py-3 rounded-xl text-center hover:shadow-lg transition flex items-center justify-center space-x-2"
                >
                  <span className="material-icons-outlined">qr_code_2</span>
                  <span>Create Attendance Code</span>
                </a>
              </div>

              {/* Recent Alerts */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                    <span className="material-icons-outlined text-orange-500">warning</span>
                    <span>Recent Alerts</span>
                  </h3>
                  <a href="#" className="text-sm text-orange-500 hover:text-orange-600">View All</a>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <span className="material-icons-outlined text-red-500 text-xl">cancel</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">Low Attendance</p>
                      <p className="text-xs text-gray-600">Advanced Algorithms (CS402) dropped below 70% threshold yesterday.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <span className="material-icons-outlined text-orange-500 text-xl">pending</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">Pending Approvals</p>
                      <p className="text-xs text-gray-600">5 students requested leave for "Data Structures".</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className="material-icons-outlined text-gray-500 text-xl">system_update</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">System Update</p>
                      <p className="text-xs text-gray-600">Scheduled maintenance at 02:00 AM tonight.</p>
                    </div>
                  </div>
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

export default LecturerDashboard;
