import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";

interface Stats { users: number; slots: number; classes: number; subjects: number; rooms: number; teachingSchedules: number; semesters: number; }
interface SlotRow { _id: string; date: string; startTime: string; endTime: string; subjectId?: { code: string; name: string }; classId?: { name: string }; roomId?: { name: string }; teacherId?: { fullName: string }; }
interface UserRow { _id: string; fullName: string; email: string; role: string; }

const IC = "material-icons-outlined";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ users: 0, slots: 0, classes: 0, subjects: 0, rooms: 0, teachingSchedules: 0, semesters: 0 });
  const [recentSlots, setRecentSlots] = useState<SlotRow[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [usersRes, slotsRes, classesRes, subjectsRes, roomsRes, tsRes, semRes] = await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/slots"),
          api.get("/admin/classes"),
          api.get("/admin/subjects"),
          api.get("/admin/rooms"),
          api.get("/admin/teaching-schedules"),
          api.get("/admin/semesters"),
        ]);
        const users = usersRes.data.data || [];
        const slots = slotsRes.data.data || [];
        setStats({
          users: users.length,
          slots: slots.length,
          classes: (classesRes.data.data || []).length,
          subjects: (subjectsRes.data.data || []).length,
          rooms: (roomsRes.data.data || []).length,
          teachingSchedules: (tsRes.data.data || []).length,
          semesters: (semRes.data.data || []).length,
        });
        setRecentSlots(slots.slice(0, 5));
        setRecentUsers(users.slice(0, 5));
      } catch { /**/ }
      finally { setLoading(false); }
    })();
  }, []);

  const statCards = [
    { label: "Kì học", value: stats.semesters,        icon: "event",              path: "/admin/semesters",          color: "#FF7043", bg: "bg-orange-500" },
    { label: "Buổi học",     value: stats.slots,             icon: "calendar_today",     path: "/admin/slots",              color: "#F59E0B", bg: "bg-amber-500" },
    { label: "Lịch dạy",     value: stats.teachingSchedules, icon: "schedule",           path: "/admin/teaching-schedules", color: "#6366F1", bg: "bg-indigo-500" },
    { label: "Lớp học",      value: stats.classes,           icon: "class",              path: "/admin/classes",            color: "#8B5CF6", bg: "bg-purple-500" },
    { label: "Môn học",      value: stats.subjects,          icon: "menu_book",          path: "/admin/subjects",           color: "#3B82F6", bg: "bg-blue-500" },
    { label: "Phòng học",    value: stats.rooms,             icon: "meeting_room",       path: "/admin/rooms",              color: "#10B981", bg: "bg-green-500" },
    { label: "Người dùng",   value: stats.users,             icon: "people",             path: "/admin/users",              color: "#FF7043", bg: "bg-orange-400" },
  ];

  const dayOfWeek = (dateStr: string) => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[new Date(dateStr).getDay()];
  };

  const ROLE_MAP: Record<string, { label: string; cls: string }> = {
    ADMIN:    { label: "Quản trị viên", cls: "bg-orange-100 text-orange-700" },
    LECTURER: { label: "Giảng viên",    cls: "bg-blue-100 text-blue-700" },
    STUDENT:  { label: "Học viên",      cls: "bg-green-100 text-green-700" },
  };

  return (
    <AdminLayout title="" breadcrumb={[{ label: "Trang chủ" }]}>
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 mb-6 text-white flex items-center justify-between">
        <div>
          <p className="text-orange-100 text-sm font-medium mb-1">Chào mừng trở lại 👋</p>
          <h1 className="text-2xl font-bold">{user?.fullName || "Quản trị viên"}</h1>
          <p className="text-orange-100 text-sm mt-1">Hệ thống quản lý điểm danh thông minh</p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="bg-white/20 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold">{stats.slots}</p>
            <p className="text-xs text-orange-100">Buổi học</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold">{stats.users}</p>
            <p className="text-xs text-orange-100">Người dùng</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold">{stats.semesters}</p>
            <p className="text-xs text-orange-100">Kì học</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "4px solid #FED7AA", borderTopColor: "#FF7043" }} />
            <span className="text-sm">Đang tải dữ liệu...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
            {statCards.map((card) => (
              <Link key={card.path} to={card.path}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-orange-200 transition group">
                <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition`}>
                  <span className={IC} style={{ color: "white", fontSize: 20 }}>{card.icon}</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{card.label}</p>
              </Link>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { to: "/admin/semesters",         icon: "add_circle", label: "Tạo kì học", color: "text-orange-500" },
              { to: "/admin/slots",             icon: "event_available", label: "Tạo buổi học", color: "text-amber-500" },
              { to: "/admin/users/create",      icon: "person_add", label: "Tạo tài khoản", color: "text-blue-500" },
              { to: "/admin/class-students",    icon: "group_add", label: "Thêm sinh viên lớp", color: "text-green-500" },
            ].map((a) => (
              <Link key={a.to} to={a.to}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm hover:border-orange-200 transition">
                <span className={`${IC} ${a.color}`} style={{ fontSize: 22 }}>{a.icon}</span>
                <span className="text-sm font-medium text-gray-700">{a.label}</span>
              </Link>
            ))}
          </div>

          {/* Tables */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={IC} style={{ color: "#F59E0B", fontSize: 20 }}>calendar_today</span>
                  <h2 className="font-semibold text-gray-800">Buổi học gần đây</h2>
                </div>
                <Link to="/admin/slots" className="text-xs font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1">
                  Xem tất cả <span className={IC} style={{ fontSize: 14 }}>arrow_forward</span>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ngày</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Môn / Lớp</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Giờ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentSlots.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-10 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <span className={IC} style={{ fontSize: 36, opacity: 0.3 }}>calendar_today</span>
                          <span className="text-sm">Chưa có buổi học</span>
                        </div>
                      </td></tr>
                    ) : (
                      recentSlots.map((s) => (
                        <tr key={s._id} className="hover:bg-amber-50/30 transition">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex-shrink-0">
                                {dayOfWeek(s.date)}
                              </span>
                              <span className="text-gray-700 text-xs">{new Date(s.date).toLocaleDateString("vi-VN")}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-medium text-gray-800 text-xs block">{s.subjectId?.code}</span>
                            <span className="text-gray-500 text-xs">{s.classId?.name}</span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-500">{s.startTime} – {s.endTime}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={IC} style={{ color: "#FF7043", fontSize: 20 }}>people</span>
                  <h2 className="font-semibold text-gray-800">Người dùng</h2>
                </div>
                <Link to="/admin/users" className="text-xs font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1">
                  Xem tất cả <span className={IC} style={{ fontSize: 14 }}>arrow_forward</span>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Người dùng</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Vai trò</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentUsers.length === 0 ? (
                      <tr><td colSpan={2} className="px-4 py-10 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <span className={IC} style={{ fontSize: 36, opacity: 0.3 }}>person_off</span>
                          <span className="text-sm">Chưa có người dùng</span>
                        </div>
                      </td></tr>
                    ) : (
                      recentUsers.map((u) => {
                        const cfg = ROLE_MAP[u.role] || { label: u.role, cls: "bg-gray-100 text-gray-600" };
                        return (
                          <tr key={u._id} className="hover:bg-orange-50/20 transition">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                                  style={{ background: u.role === "ADMIN" ? "#FF7043" : u.role === "LECTURER" ? "#3B82F6" : "#10B981" }}>
                                  {u.fullName?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-800 text-xs block">{u.fullName}</span>
                                  <span className="text-gray-400 text-xs">{u.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
