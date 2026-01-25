// StudentSchedule.tsx
// File hoàn chỉnh: component + tailwind config + dark mode toggle

import React from 'react';

// ────────────────────────────────────────────────
// Tailwind config (thay vì tailwind.config.js riêng)
const tailwindConfig = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#f97316',
        'background-light': '#f8fafc',
        'background-dark': '#0f172a',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};

// Vì đây là single file, ta giả lập tailwind config bằng cách inject script
// (trong dự án thật thì nên để trong tailwind.config.js)
if (typeof window !== 'undefined' && !('tailwind' in window)) {
  // @ts-ignore
  window.tailwind = tailwindConfig;
}

// ────────────────────────────────────────────────

const StudentSchedule: React.FC = () => {
  return (
    <>
      {/* Google Fonts + Material Icons (giống HTML gốc) */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
        rel="stylesheet"
      />

      <style>{`
        body {
          font-family: 'Inter', sans-serif;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }
        .day-column {
          min-height: 600px;
        }
        .current-day-highlight {
          background: linear-gradient(180deg, rgba(249, 115, 22, 0.05) 0%, rgba(249, 115, 22, 0.02) 100%);
        }
      `}</style>

      <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                  <span className="material-icons-outlined">school</span>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-6">
                <a
                  href="#"
                  className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-icons-outlined text-[20px]">home</span>
                  <span className="font-medium">Trang chủ</span>
                </a>
                <a
                  href="#"
                  className="flex items-center space-x-2 text-primary border-b-2 border-primary py-5"
                >
                  <span className="material-icons-outlined text-[20px]">calendar_today</span>
                  <span className="font-medium">Lịch học</span>
                </a>
                <a
                  href="#"
                  className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-icons-outlined text-[20px]">assignment_turned_in</span>
                  <span className="font-medium">Báo cáo điểm danh</span>
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative">
                <span className="material-icons-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              </button>

              <div className="flex items-center space-x-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">Nguyễn Văn A</p>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">Sinh viên</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                  N
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <span className="material-icons-outlined">logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
                Lịch học học tập
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Quản lý thời gian và lộ trình học tập hiệu quả
              </p>
            </div>

            <div className="inline-flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <button className="px-5 py-2 text-sm font-medium rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                Ngày
              </button>
              <button className="px-5 py-2 text-sm font-medium rounded-lg bg-orange-50 dark:bg-orange-500/10 text-primary">
                Tuần
              </button>
              <button className="px-5 py-2 text-sm font-medium rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                Tháng
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-sm">
                <span className="material-icons-outlined text-slate-600 dark:text-slate-300">
                  chevron_left
                </span>
              </button>
              <h2 className="text-lg font-bold text-primary tracking-wide">Tháng 10 - 2023</h2>
              <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-sm">
                <span className="material-icons-outlined text-slate-600 dark:text-slate-300">
                  chevron_right
                </span>
              </button>
            </div>

            <div className="calendar-grid">
              {/* Header ngày */}
              <div className="py-4 border-b border-r border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Thứ 2
                </p>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">25</p>
              </div>
              <div className="py-4 border-b border-r border-slate-200 dark:border-slate-800 text-center bg-orange-50/50 dark:bg-orange-500/5 ring-1 ring-inset ring-primary/20">
                <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-1">
                  Thứ 3
                </p>
                <p className="text-xl font-extrabold text-primary">26</p>
              </div>
              <div className="py-4 border-b border-r border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Thứ 4
                </p>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">27</p>
              </div>
              <div className="py-4 border-b border-r border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Thứ 5
                </p>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">28</p>
              </div>
              <div className="py-4 border-b border-r border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Thứ 6
                </p>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">29</p>
              </div>
              <div className="py-4 border-b border-r border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Thứ 7
                </p>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">30</p>
              </div>
              <div className="py-4 border-b border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  CN
                </p>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">31</p>
              </div>

              {/* Cột Thứ 2 */}
              <div className="day-column border-r border-slate-200 dark:border-slate-800 p-3 space-y-4">
                <div className="group bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                      [ENG]
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      07:00 - 09:00
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3 leading-snug">
                    Tiếng Anh - ENG202
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <span className="material-icons-outlined text-[14px] mr-2 text-slate-400">person</span>
                      ThS. David Brown
                    </div>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <span className="material-icons-outlined text-[14px] mr-2 text-slate-400">place</span>
                      Beta 101
                    </div>
                  </div>
                  <button className="mt-4 w-full py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center space-x-2 group-hover:border-primary/30 group-hover:text-primary transition-colors">
                    <span className="material-icons-outlined text-[16px]">visibility</span>
                    <span>Xem lại</span>
                  </button>
                </div>
              </div>

              {/* Cột Thứ 3 - ngày hiện tại */}
              <div className="day-column current-day-highlight border-r border-slate-200 dark:border-slate-800 p-3 space-y-4 relative">
                <div className="absolute inset-0 ring-1 ring-inset ring-primary/20 pointer-events-none"></div>

                <div className="relative bg-white dark:bg-slate-800 border-2 border-primary/20 rounded-xl p-4 shadow-lg shadow-primary/5 transition-all duration-300">
                  <div className="absolute -left-0.5 top-6 bottom-6 w-1 bg-primary rounded-full"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-500/20 text-[10px] font-bold text-primary uppercase">
                      [IT]
                    </span>
                    <span className="text-[11px] font-semibold text-primary">08:00 - 10:00</span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3 leading-snug">
                    Cơ Sở Dữ Liệu - DS302
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <span className="material-icons-outlined text-[14px] mr-2 text-primary/60">person</span>
                      TS. Phan Đức Mạnh
                    </div>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <span className="material-icons-outlined text-[14px] mr-2 text-primary/60">place</span>
                      Gamma 211
                    </div>
                  </div>
                </div>

                <div className="relative bg-white dark:bg-slate-800 border-2 border-primary/20 rounded-xl p-4 shadow-lg shadow-primary/5 transition-all duration-300">
                  <div className="absolute -left-0.5 top-6 bottom-6 w-1 bg-primary rounded-full"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-500/20 text-[10px] font-bold text-primary uppercase">
                      [IT]
                    </span>
                    <span className="text-[11px] font-semibold text-primary">13:00 - 15:00</span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3 leading-snug">
                    Lập Trình Web - IT404
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <span className="material-icons-outlined text-[14px] mr-2 text-primary/60">person</span>
                      ThS. Nguyễn Thị B
                    </div>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <span className="material-icons-outlined text-[14px] mr-2 text-primary/60">place</span>
                      Alpha 305
                    </div>
                  </div>
                </div>
              </div>

              {/* Các cột trống còn lại */}
              <div className="day-column border-r border-slate-200 dark:border-slate-800 p-3 space-y-4" />
              <div className="day-column border-r border-slate-200 dark:border-slate-800 p-3 space-y-4" />
              <div className="day-column border-r border-slate-200 dark:border-slate-800 p-3 space-y-4" />
              <div className="day-column border-r border-slate-200 dark:border-slate-800 p-3 space-y-4" />
              <div className="day-column p-3 space-y-4" />
            </div>
          </div>
        </main>

        <footer className="mt-12 text-center pb-8">
          <p className="text-sm text-slate-400 dark:text-slate-600">
            © 2023 Smart Attendance System. All rights reserved.
          </p>
        </footer>

        {/* Dark mode toggle */}
        <button
          className="fixed bottom-6 right-6 p-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all"
          onClick={() => document.documentElement.classList.toggle('dark')}
          type="button"
          aria-label="Toggle dark mode"
        >
          <span className="material-icons-outlined">dark_mode</span>
        </button>
      </div>
    </>
  );
};

export default StudentSchedule;