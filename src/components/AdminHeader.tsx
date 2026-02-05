import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ADMIN_HEADER_CSS = `
  .admin-header-nav {
    background: white;
    border-bottom: 1px solid #E5E7EB;
    position: sticky;
    top: 0;
    z-index: 50;
    padding: 0 1.5rem;
  }
  .admin-header-content {
    max-width: 1200px;
    margin: 0 auto;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .admin-logo-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .admin-logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #FF7043, #FFAB91);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(255,112,67,0.3);
  }
  .admin-logo-text {
    font-size: 18px;
    font-weight: 700;
    color: #1F2937;
    text-decoration: none;
  }
  .admin-logo-text:hover {
    color: #1F2937;
  }
  .admin-nav-links {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .admin-nav-link {
    font-size: 14px;
    font-weight: 500;
    color: #6B7280;
    text-decoration: none;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    transition: color 0.2s, background 0.2s;
  }
  .admin-nav-link:hover {
    color: #FF7043;
    background: #FFF7ED;
  }
  .admin-nav-link.active {
    color: #FF7043;
    font-weight: 600;
    background: #FFF7ED;
  }
  .admin-user-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .admin-user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-left: 1rem;
    border-left: 1px solid #E5E7EB;
  }
  .admin-user-details {
    text-align: right;
  }
  .admin-user-name {
    font-size: 14px;
    font-weight: 600;
    color: #1F2937;
  }
  .admin-user-role {
    font-size: 12px;
    color: #6B7280;
  }
  .admin-user-avatar {
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
  .admin-logout-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    color: #6B7280;
    transition: color 0.2s;
  }
  .admin-logout-btn:hover {
    color: #EF4444;
  }
`;

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/admin/dashboard", label: "Tổng quan" },
    { path: "/admin/slots", label: "Lịch học" },
    { path: "/admin/teaching-schedules", label: "Lịch dạy" },
    { path: "/admin/class-students", label: "SV theo lớp" },
    { path: "/admin/subjects", label: "Môn học" },
    { path: "/admin/classes", label: "Lớp học" },
    { path: "/admin/rooms", label: "Phòng học" },
  ];

  return (
    <>
      <style>{ADMIN_HEADER_CSS}</style>
      <header className="admin-header-nav">
        <div className="admin-header-content">
          <div className="admin-logo-section">
            <div className="admin-logo-icon">
              <span className="material-icons-outlined" style={{ color: "white", fontSize: "24px" }}>admin_panel_settings</span>
            </div>
            <Link to="/admin/dashboard" className="admin-logo-text">Smart Attendance</Link>
          </div>

          <nav className="admin-nav-links">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-link ${isActive(item.path) ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="admin-user-section">
            <div className="admin-user-info">
              <div className="admin-user-details">
                <p className="admin-user-name">{user?.fullName || "Quản trị"}</p>
                <p className="admin-user-role">Quản trị viên</p>
              </div>
              <div className="admin-user-avatar">{user?.fullName?.charAt(0) || "A"}</div>
              <button onClick={logout} className="admin-logout-btn" type="button">
                <span className="material-icons-outlined">logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
