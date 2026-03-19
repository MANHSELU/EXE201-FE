import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { connectSocket } from "../services/socket";

interface Notif {
  _id: string;
  fromUserId: { fullName: string; role: string };
  type: string;
  postId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

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
  .student-user-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
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
    border-radius: 50%;
    cursor: pointer;
    color: #6B7280;
    transition: all 0.2s;
  }
  .student-notification-btn:hover {
    background: #F3F4F6;
    color: #FF7043;
  }
  .student-notification-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    min-width: 18px;
    height: 18px;
    background: #EF4444;
    border-radius: 9px;
    border: 2px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: white;
    padding: 0 4px;
  }
  .student-user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
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
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4F46E5, #818CF8);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 15px;
  }
  .student-logout-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: #6B7280;
    transition: all 0.2s;
  }
  .student-logout-btn:hover {
    color: #EF4444;
    background: #FEF2F2;
  }
  .notif-dropdown {
    position: absolute;
    top: 48px;
    right: 0;
    width: 360px;
    max-height: 420px;
    overflow-y: auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    border: 1px solid #E5E7EB;
    z-index: 100;
  }
  .notif-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .notif-item:hover {
    background: #F9FAFB;
  }
  .notif-item.unread {
    background: #FFF7ED;
  }
  .notif-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 15px;
    flex-shrink: 0;
  }
  .notif-text {
    font-size: 13px;
    color: #374151;
    line-height: 1.4;
    flex: 1;
  }
  .notif-time {
    font-size: 11px;
    color: #9CA3AF;
    margin-top: 2px;
  }
`;

const NOTIF_ICON_MAP: Record<string, { icon: string; color: string }> = {
  LIKE: { icon: "favorite", color: "#EF4444" },
  COMMENT: { icon: "chat_bubble", color: "#3B82F6" },
  POST_APPROVED: { icon: "check_circle", color: "#22C55E" },
  POST_REJECTED: { icon: "cancel", color: "#EF4444" },
};

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
  return `${Math.floor(diff / 86400)} ngày`;
}

export default function StudentHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const fetchUnread = async () => {
    try { const res = await api.get("/student/notifications/unread-count"); setUnreadCount(res.data.count); } catch { /**/ }
  };

  const fetchNotifications = async () => {
    try { const res = await api.get("/student/notifications"); setNotifications(res.data.data || []); } catch { /**/ }
  };

  const handleOpenNotifs = async () => {
    if (!showNotifs) {
      await fetchNotifications();
      setShowNotifs(true);
      // Mark as read
      try { await api.patch("/student/notifications/mark-read"); setUnreadCount(0); } catch { /**/ }
    } else {
      setShowNotifs(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    if (user?.id) {
      const socket = connectSocket(user.id);
      socket.on("notification", () => {
        setUnreadCount((c) => c + 1);
        // If dropdown is open, refresh it
        fetchNotifications();
      });
      return () => { socket.off("notification"); };
    }
  }, [user?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button className="student-notification-btn" type="button" aria-label="Thông báo" onClick={handleOpenNotifs}>
                <span className="material-icons-outlined" style={{ fontSize: "22px" }}>notifications</span>
                {unreadCount > 0 && <span className="student-notification-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </button>

              {showNotifs && (
                <div className="notif-dropdown">
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #E5E7EB" }}>
                    <p style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>Thông báo</p>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "32px 16px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                      Chưa có thông báo nào
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const iconInfo = NOTIF_ICON_MAP[n.type] || { icon: "notifications", color: "#6B7280" };
                      return (
                        <div key={n._id} className={`notif-item ${!n.read ? "unread" : ""}`}
                          onClick={() => {
                            setShowNotifs(false);
                            if (n.postId) {
                              navigate(`/student/dashboard?postId=${n.postId}`);
                              setTimeout(() => {
                                const el = document.getElementById(`post-${n.postId}`);
                                if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.style.boxShadow = "0 0 0 3px #FF7043"; setTimeout(() => { el.style.boxShadow = ""; }, 2000); }
                              }, 500);
                            }
                          }}>
                          <div className="notif-avatar" style={{ background: iconInfo.color }}>
                            <span className="material-icons-outlined" style={{ fontSize: 20, color: "white" }}>{iconInfo.icon}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p className="notif-text">{n.message}</p>
                            <p className="notif-time">{timeAgo(n.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <div className="student-user-info">
              <div className="student-user-details">
                <p className="student-user-name">{user?.fullName || "Sinh viên"}</p>
                <p className="student-user-role">Sinh viên</p>
              </div>
              <div className="student-user-avatar">{user?.fullName?.charAt(0) || "S"}</div>
              <button onClick={logout} className="student-logout-btn" type="button" title="Đăng xuất">
                <span className="material-icons-outlined" style={{ fontSize: "20px" }}>logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
