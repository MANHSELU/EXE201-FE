import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const LECTURER_HEADER_CSS = `
  .lecturer-header-nav {
    background: white;
    border-bottom: 1px solid #E5E7EB;
    position: sticky;
    top: 0;
    z-index: 50;
    padding: 0 1.5rem;
  }
  .lecturer-header-content {
    max-width: 1200px;
    margin: 0 auto;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .lecturer-logo-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .lecturer-logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #FF7043, #FFAB91);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(255,112,67,0.3);
  }
  .lecturer-logo-text {
    font-size: 18px;
    font-weight: 700;
    color: #1F2937;
  }
  .lecturer-nav-links {
    display: flex;
    align-items: center;
    gap: 2rem;
  }
  .lecturer-nav-link {
    font-size: 14px;
    font-weight: 500;
    color: #6B7280;
    text-decoration: none;
    transition: color 0.2s;
  }
  .lecturer-nav-link:hover {
    color: #FF7043;
  }
  .lecturer-nav-link.active {
    color: #FF7043;
    font-weight: 600;
  }
  .lecturer-user-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .lecturer-notification-btn {
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
  .lecturer-notification-btn:hover {
    background: #F3F4F6;
  }
  .lecturer-notification-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    background: #FF7043;
    border-radius: 50%;
  }
  .lecturer-user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-left: 1rem;
    border-left: 1px solid #E5E7EB;
  }
  .lecturer-user-details {
    text-align: right;
  }
  .lecturer-user-name {
    font-size: 14px;
    font-weight: 600;
    color: #1F2937;
  }
  .lecturer-user-role {
    font-size: 12px;
    color: #6B7280;
  }
  .lecturer-user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FF7043, #FFAB91);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
  }
`;

export default function LecturerHeader() {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      <style>{LECTURER_HEADER_CSS}</style>
      <header className="lecturer-header-nav">
        <div className="lecturer-header-content">
          <div className="lecturer-logo-section">
            <div className="lecturer-logo-icon">
              <span className="material-icons-outlined" style={{ color: "white", fontSize: "24px" }}>school</span>
            </div>
            <a href="/lecturer/dashboard" className="lecturer-logo-text" style={{ textDecoration: "none", color: "inherit" }}>Smart Attendance</a>
          </div>

          <nav className="lecturer-nav-links">
            <a href="/lecturer/dashboard" className={`lecturer-nav-link ${isActive("/lecturer/dashboard") && !location.pathname.includes("/attendance") ? "active" : ""}`}>Trang chủ</a>
            <a href="/lecturer/schedule" className={`lecturer-nav-link ${isActive("/lecturer/schedule") ? "active" : ""}`}>Lịch dạy</a>
            <a href="/lecturer/reports" className={`lecturer-nav-link ${isActive("/lecturer/reports") ? "active" : ""}`}>Báo cáo điểm danh</a>
          </nav>

          <div className="lecturer-user-section">
            <button className="lecturer-notification-btn" type="button">
              <span className="material-icons-outlined" style={{ color: "#6B7280", fontSize: "24px" }}>notifications</span>
              <span className="lecturer-notification-dot" />
            </button>
            <div className="lecturer-user-info">
              <div className="lecturer-user-details">
                <p className="lecturer-user-name">{user?.fullName || "Giảng viên"}</p>
                <p className="lecturer-user-role">Giảng viên</p>
              </div>
              <div className="lecturer-user-avatar">{user?.fullName?.charAt(0) || "G"}</div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
