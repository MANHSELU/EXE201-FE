import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/Footer";
import LecturerHeader from "../../components/LecturerHeader";

const LecturerStatistics: React.FC = () => {
  useAuth();
  const [selectedDate, setSelectedDate] = useState("10/24/2023");

  const students = [
    { id: "2023001", name: "Alice Johnson", major: "Computer Science", arrival: "08:55 AM", status: "Present", rate: 98 },
    { id: "2023002", name: "Bob Smith", major: "Info Systems", arrival: "--:--", status: "Absent", rate: 72 },
    { id: "2023005", name: "Charlie Williams", major: "Computer Science", arrival: "09:15 AM", status: "Late", rate: 88 },
    { id: "2023008", name: "Diana Evans", major: "Software Eng", arrival: "08:58 AM", status: "Present", rate: 92 },
    { id: "2023012", name: "Ethan Hunt", major: "Computer Science", arrival: "09:00 AM", status: "Present", rate: 100 },
  ];

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
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#FFF8F5' }}>
        <LecturerHeader />

        {/* Main */}
        <main className="max-w-[1440px] mx-auto px-8 py-8">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-4">
            <a href="/lecturer/dashboard" className="hover:text-orange-500">Home</a>
            <span className="mx-2">/</span>
            <a href="/lecturer/schedule" className="hover:text-orange-500">Class</a>
            <span className="mx-2">/</span>
            <span className="text-gray-800 font-medium">Statistics</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Intro to Computer Science</h1>
            <p className="text-gray-500">Class Attendance Statistics • CS-101 • Fall 2023</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="material-icons-outlined text-blue-600 text-2xl">people</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Students</p>
                  <p className="text-3xl font-bold text-gray-800">45</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="material-icons-outlined text-green-600 text-2xl">check_circle</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Present Today</p>
                  <p className="text-3xl font-bold text-gray-800">40</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="material-icons-outlined text-red-600 text-2xl">cancel</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Absent Today</p>
                  <p className="text-3xl font-bold text-gray-800">5</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="material-icons-outlined text-orange-600 text-2xl">bar_chart</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Avg Attendance</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-3xl font-bold text-gray-800">89%</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-xs text-green-600 font-semibold">
                <span className="material-icons-outlined text-sm">trending_up</span>
                <span>+2.4% vs last week</span>
              </div>
            </div>
          </div>

          {/* Filter + Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <span className="material-icons-outlined absolute left-3 top-2.5 text-gray-400 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search student by name or ID..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-80"
                  />
                </div>

                <div className="relative">
                  <span className="material-icons-outlined absolute left-3 top-2.5 text-gray-400 text-lg">
                    calendar_today
                  </span>
                  <input
                    type="text"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center space-x-2">
                  <span className="material-icons-outlined text-base">tune</span>
                  <span>Filter</span>
                </button>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 flex items-center space-x-2">
                  <span className="material-icons-outlined text-base">file_download</span>
                  <span>Export to Excel</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Arrival Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Attendance Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.major}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{student.id}</td>
                      <td className="px-6 py-4 text-gray-700">{student.arrival}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            student.status === "Present"
                              ? "bg-green-100 text-green-700"
                              : student.status === "Late"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-gray-800">{student.rate}%</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                            <div
                              className={`h-full ${
                                student.rate >= 90
                                  ? "bg-green-500"
                                  : student.rate >= 70
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${student.rate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">Showing 1 to 5 of 45 results</p>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  <span className="material-icons-outlined text-base">chevron_left</span>
                </button>
                <button className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm font-semibold">1</button>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">2</button>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">3</button>
                <span className="text-sm text-gray-500">...</span>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">9</button>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  <span className="material-icons-outlined text-base">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default LecturerStatistics;
