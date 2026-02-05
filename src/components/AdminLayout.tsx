import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SIDEBAR_CSS = `
  .admin-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 260px;
    background: #fff;
    border-right: 1px solid #E5E7EB;
    display: flex;
    flex-direction: column;
    z-index: 40;
  }
  .admin-sidebar-logo {
    height: 64px;
    padding: 0 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid #E5E7EB;
  }
  .admin-sidebar-logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #FF7043, #FFAB91);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(255,112,67,0.3);
  }
  .admin-sidebar-logo-text {
    font-size: 18px;
    font-weight: 700;
    color: #1F2937;
    text-decoration: none;
  }
  .admin-sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0;
  }
  .admin-sidebar-nav-section {
    padding: 0 0.75rem;
    margin-bottom: 0.5rem;
  }
  .admin-sidebar-nav-title {
    font-size: 11px;
    font-weight: 600;
    color: #9CA3AF;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 0.75rem 0.5rem;
  }
  .admin-sidebar-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
    margin-bottom: 2px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #4B5563;
    text-decoration: none;
    transition: background 0.2s, color 0.2s;
  }
  .admin-sidebar-link:hover {
    background: #FFF7ED;
    color: #FF7043;
  }
  .admin-sidebar-link.active {
    background: #FFF7ED;
    color: #FF7043;
    font-weight: 600;
  }
  .admin-sidebar-link .material-icons-outlined {
    font-size: 20px;
    opacity: 0.9;
  }
  .admin-sidebar-user {
    padding: 1rem 1.5rem;
    border-top: 1px solid #E5E7EB;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .admin-sidebar-user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FF7043, #FFAB91);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    flex-shrink: 0;
  }
  .admin-sidebar-user-info {
    flex: 1;
    min-width: 0;
  }
  .admin-sidebar-user-name {
    font-size: 14px;
    font-weight: 600;
    color: #1F2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .admin-sidebar-user-role {
    font-size: 12px;
    color: #6B7280;
  }
  .admin-sidebar-logout {
    padding: 0.5rem;
    border: none;
    background: none;
    cursor: pointer;
    color: #6B7280;
    border-radius: 8px;
    transition: color 0.2s, background 0.2s;
  }
  .admin-sidebar-logout:hover {
    color: #EF4444;
    background: #FEF2F2;
  }
  .admin-main-wrap {
    margin-left: 260px;
    min-height: 100vh;
    background: #F9FAFB;
  }
  .admin-main-content {
    padding: 1.5rem 2rem 2rem;
  }
  .admin-breadcrumb {
    font-size: 14px;
    color: #6B7280;
    margin-bottom: 1.5rem;
  }
  .admin-breadcrumb a {
    color: #FF7043;
    text-decoration: none;
  }
  .admin-breadcrumb a:hover {
    text-decoration: underline;
  }
`;

const navSections = [
  {
    title: "Tổng quan",
    items: [
      { path: "/admin/dashboard", label: "Trang chủ", icon: "dashboard" },
    ],
  },
  {
    title: "Lịch & Lớp",
    items: [
      { path: "/admin/semesters", label: "Kì học", icon: "event" },
      { path: "/admin/slots", label: "Lịch học (tiết)", icon: "calendar_today" },
      { path: "/admin/teaching-schedules", label: "Lịch dạy", icon: "schedule" },
      { path: "/admin/class-students", label: "Sinh viên theo lớp", icon: "group" },
    ],
  },
  {
    title: "Danh mục",
    items: [
      { path: "/admin/subjects", label: "Môn học", icon: "menu_book" },
      { path: "/admin/classes", label: "Lớp học", icon: "class" },
      { path: "/admin/rooms", label: "Phòng học", icon: "meeting_room" },
    ],
  },
  {
    title: "Người dùng",
    items: [
      { path: "/admin/users", label: "Quản lý người dùng", icon: "people" },
      { path: "/admin/users/create", label: "Tạo tài khoản", icon: "person_add" },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: { label: string; path?: string }[];
}

export default function AdminLayout({ children, title, breadcrumb }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/admin/dashboard") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
      <style>{SIDEBAR_CSS}</style>
      <div className="flex min-h-screen bg-gray-50">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-logo">
            <div className="admin-sidebar-logo-icon">
              <span className="material-icons-outlined" style={{ color: "white", fontSize: "24px" }}>admin_panel_settings</span>
            </div>
            <Link to="/admin/dashboard" className="admin-sidebar-logo-text">Smart Attendance</Link>
          </div>
          <nav className="admin-sidebar-nav">
            {navSections.map((section) => (
              <div key={section.title} className="admin-sidebar-nav-section">
                <div className="admin-sidebar-nav-title">{section.title}</div>
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`admin-sidebar-link ${isActive(item.path) ? "active" : ""}`}
                  >
                    <span className="material-icons-outlined">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-user-avatar">{user?.fullName?.charAt(0) || "A"}</div>
            <div className="admin-sidebar-user-info">
              <p className="admin-sidebar-user-name">{user?.fullName || "Quản trị"}</p>
              <p className="admin-sidebar-user-role">Quản trị viên</p>
            </div>
            <button type="button" onClick={handleLogout} className="admin-sidebar-logout" title="Đăng xuất">
              <span className="material-icons-outlined">logout</span>
            </button>
          </div>
        </aside>
        <main className="admin-main-wrap">
          <div className="admin-main-content">
            {breadcrumb && breadcrumb.length > 0 && (
              <div className="admin-breadcrumb">
                <Link to="/admin/dashboard">Admin</Link>
                {breadcrumb.map((b, i) => (
                  <span key={i}>
                    <span className="mx-1">/</span>
                    {b.path ? <Link to={b.path}>{b.label}</Link> : <span>{b.label}</span>}
                  </span>
                ))}
              </div>
            )}
            {title && <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>}
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
