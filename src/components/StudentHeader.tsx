import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const STUDENT_HEADER_CSS = `
  .student-header-nav {
    background: white;
    border-bottom: 1px solid #E5E7EB;
    position: sticky;
    top: 0;
    z-index: 50;
    padding: 0 1.5rem;
  }
  .student-header-content {
    max-width: 1200px;
    margin: 0 auto;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .student-logo-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .student-logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #FF7043, #FFAB91);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(255,112,67,0.3);
  }
  .student-logo-text {
    font-size: 18px;
    font-weight: 700;
    color: #1F2937;
  }
  .student-nav-links {
    display: flex;
    align-items: center;
    gap: 2rem;
  }
  .student-nav-link {
    font-size: 14px;
    font-weight: 500;
    color: #6B7280;
    text-decoration: none;
    transition: color 0.2s;
  }
  .student-nav-link:hover {
    color: #FF7043;
  }
  .student-nav-link.active {
    color: #FF7043;
    font-weight: 600;
  }
  .student-user-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .student-user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-left: 1rem;
    border-left: 1px solid #E5E7EB;
  }
  .student-user-details {
    text-align: right;
  }
  .student-user-name {
    font-size: 14px;
    font-weight: 600;
    color: #1F2937;
  }
  .student-user-role {
    font-size: 12px;
    color: #6B7280;
  }
  .student-user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4F46E5, #818CF8);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
  }
  .student-logout-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    color: #6B7280;
    transition: color 0.2s;
  }
  .student-logout-btn:hover {
    color: #EF4444;
  }
  .student-notification-btn {
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    border-radius: 10px;
    cursor: pointer;
    color: #6B7280;
  }
  .student-notification-btn:hover {
    background: #F3F4F6;
    color: #FF7043;
  }
  .student-notification-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    background: #FF7043;
    border-radius: 50%;
    border: 2px solid white;
  }
`;

export default function StudentHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <style>{STUDENT_HEADER_CSS}</style>
      <header className="student-header-nav">
        <div className="student-header-content">
          <div className="student-logo-section">
            <div className="student-logo-icon">
              <span className="material-icons-outlined" style={{ color: "white", fontSize: "24px" }}>school</span>
            </div>
            <a href="/student/dashboard" className="student-logo-text" style={{ textDecoration: "none", color: "inherit" }}>Smart Attendance</a>
          </div>

          <nav className="student-nav-links">
            <a href="/student/dashboard" className={`student-nav-link ${isActive("/student/dashboard") ? "active" : ""}`}>Trang chủ</a>
            <a href="/student/schedule" className={`student-nav-link ${isActive("/student/schedule") ? "active" : ""}`}>Lịch học</a>
            <a href="/student/report" className={`student-nav-link ${isActive("/student/report") ? "active" : ""}`}>Báo cáo điểm danh</a>
          </nav>

          <div className="student-user-section">
            <button className="student-notification-btn" type="button" aria-label="Thông báo">
              <span className="material-icons-outlined" style={{ fontSize: "24px" }}>notifications</span>
              <span className="student-notification-dot" aria-hidden />
            </button>
            <div className="student-user-info">
              <div className="student-user-details">
                <p className="student-user-name">{user?.fullName || "Sinh viên"}</p>
                <p className="student-user-role">Sinh viên</p>
              </div>
              <div className="student-user-avatar">{user?.fullName?.charAt(0) || "S"}</div>
              <button onClick={logout} className="student-logout-btn" type="button">
                <span className="material-icons-outlined">logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
