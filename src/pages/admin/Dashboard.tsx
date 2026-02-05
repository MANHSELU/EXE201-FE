import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";
import Footer from "../../components/Footer";

interface Stats {
  users: number;
  slots: number;
  classes: number;
  subjects: number;
  rooms: number;
  teachingSchedules: number;
}

interface SlotRow {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  subjectId?: { code: string; name: string };
  classId?: { name: string };
  roomId?: { name: string };
  teacherId?: { fullName: string };
}

interface UserRow {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ users: 0, slots: 0, classes: 0, subjects: 0, rooms: 0, teachingSchedules: 0 });
  const [recentSlots, setRecentSlots] = useState<SlotRow[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [usersRes, slotsRes, classesRes, subjectsRes, roomsRes, tsRes] = await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/slots"),
          api.get("/admin/classes"),
          api.get("/admin/subjects"),
          api.get("/admin/rooms"),
          api.get("/admin/teaching-schedules"),
        ]);
        const users = usersRes.data.data || [];
        const slots = slotsRes.data.data || [];
        const classes = classesRes.data.data || [];
        const subjects = subjectsRes.data.data || [];
        const rooms = roomsRes.data.data || [];
        const teachingSchedules = tsRes.data.data || [];
        setStats({
          users: users.length,
          slots: slots.length,
          classes: classes.length,
          subjects: subjects.length,
          rooms: rooms.length,
          teachingSchedules: teachingSchedules.length,
        });
        setRecentSlots(slots.slice(0, 5));
        setRecentUsers(users.slice(0, 5));
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const statCards = [
    { label: "Người dùng", value: stats.users, icon: "people", path: "/admin/users", color: "from-orange-500 to-orange-600" },
    { label: "Buổi học", value: stats.slots, icon: "calendar_today", path: "/admin/slots", color: "from-amber-500 to-amber-600" },
    { label: "Lớp học", value: stats.classes, icon: "class", path: "/admin/classes", color: "from-orange-400 to-orange-500" },
    { label: "Môn học", value: stats.subjects, icon: "menu_book", path: "/admin/subjects", color: "from-amber-400 to-amber-500" },
    { label: "Phòng học", value: stats.rooms, icon: "meeting_room", path: "/admin/rooms", color: "from-orange-400 to-orange-500" },
    { label: "Lịch dạy", value: stats.teachingSchedules, icon: "schedule", path: "/admin/teaching-schedules", color: "from-amber-400 to-amber-500" },
  ];

  return (
    <AdminLayout title="Trang chủ" breadcrumb={[{ label: "Trang chủ" }]}>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((card) => (
              <Link
                key={card.path}
                to={card.path}
                className={`bg-gradient-to-br ${card.color} rounded-xl shadow-sm p-5 text-white hover:shadow-md transition`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-icons-outlined text-2xl opacity-90">{card.icon}</span>
                  <span className="text-2xl font-bold">{card.value}</span>
                </div>
                <p className="text-sm font-medium opacity-90">{card.label}</p>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h2 className="font-semibold text-gray-800">Buổi học gần đây</h2>
                <Link to="/admin/slots" className="text-sm text-orange-500 hover:text-orange-600 font-medium">Xem tất cả</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Ngày</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Môn / Lớp</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Giờ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSlots.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">Chưa có buổi học</td></tr>
                    ) : (
                      recentSlots.map((s) => (
                        <tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700">{new Date(s.date).toLocaleDateString("vi-VN")}</td>
                          <td className="px-4 py-3">{s.subjectId?.code} / {s.classId?.name}</td>
                          <td className="px-4 py-3 text-gray-600">{s.startTime} - {s.endTime}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h2 className="font-semibold text-gray-800">Người dùng mới</h2>
                <Link to="/admin/users" className="text-sm text-orange-500 hover:text-orange-600 font-medium">Xem tất cả</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Họ tên</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Vai trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">Chưa có người dùng</td></tr>
                    ) : (
                      recentUsers.map((u) => (
                        <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{u.fullName}</td>
                          <td className="px-4 py-3 text-gray-600">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              u.role === "ADMIN" ? "bg-orange-100 text-orange-700" :
                              u.role === "LECTURER" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"
                            }`}>{u.role}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
      <Footer />
    </AdminLayout>
  );
}

export default AdminDashboard;
