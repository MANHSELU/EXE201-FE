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

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
