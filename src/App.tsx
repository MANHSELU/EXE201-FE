import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import Login from "./pages/Login";
import StudentDashboard from "./pages/student/Dashboard";
import StudentSchedule from "./pages/student/Schedule";
import StudentAttendance from "./pages/student/Attendance";
import StudentCheckIn from "./pages/student/CheckIn";
import StudentFaceRegister from "./pages/student/FaceRegister";
import StudentReport from "./pages/student/Report";
import LecturerDashboard from "./pages/lecturer/Dashboard";
import LecturerSchedule from "./pages/lecturer/Schedule";
import GenerateAttendance from "./pages/lecturer/GenerateAttendance";
import LecturerStatistics from "./pages/lecturer/Statistics";
import LecturerReports from "./pages/lecturer/Reports";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSubjects from "./pages/admin/Subjects";
import AdminClasses from "./pages/admin/Classes";
import AdminRooms from "./pages/admin/Rooms";
import AdminScheduleSlots from "./pages/admin/ScheduleSlots";
import AdminClassStudents from "./pages/admin/ClassStudents";
import AdminTeachingSchedules from "./pages/admin/TeachingSchedules";
import AdminSemesters from "./pages/admin/Semesters";
import AdminUsers from "./pages/admin/Users";
import AdminCreateUser from "./pages/admin/CreateUser";

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/schedule"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/checkin"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentCheckIn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/face-register"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentFaceRegister />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/report"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentReport />
              </ProtectedRoute>
            }
          />

          {/* Lecturer Routes */}
          <Route
            path="/lecturer/dashboard"
            element={
              <ProtectedRoute allowedRoles={["LECTURER"]}>
                <LecturerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/schedule"
            element={
              <ProtectedRoute allowedRoles={["LECTURER"]}>
                <LecturerSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/attendance/generate"
            element={
              <ProtectedRoute allowedRoles={["LECTURER"]}>
                <GenerateAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/reports"
            element={
              <ProtectedRoute allowedRoles={["LECTURER"]}>
                <LecturerReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/statistics"
            element={
              <ProtectedRoute allowedRoles={["LECTURER"]}>
                <LecturerStatistics />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminSubjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/classes"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rooms"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminRooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/slots"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminScheduleSlots />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/class-students"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminClassStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teaching-schedules"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminTeachingSchedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/semesters"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminSemesters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/create"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminCreateUser />
              </ProtectedRoute>
            }
          />

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
