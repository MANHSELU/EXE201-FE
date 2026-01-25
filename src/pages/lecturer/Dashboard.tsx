import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Footer from "../../components/Footer";

interface Slot {
  _id: string;
  subjectId: { code: string; name: string };
  classId: { name: string };
  roomId: { name: string };
  date: string;
  startTime: string;
  endTime: string;
}

// Các câu động viên cho giảng viên
const motivationalQuotes = [
  { quote: "Mỗi bài giảng của bạn là một hạt giống tri thức được gieo vào tâm hồn sinh viên! 🌱", author: "Smart Attendance" },
  { quote: "Giáo viên giỏi không chỉ dạy kiến thức, mà còn truyền cảm hứng cho cả cuộc đời! ✨", author: "Smart Attendance" },
  { quote: "Hôm nay là một ngày tuyệt vời để tạo ra sự khác biệt trong cuộc đời ai đó! 🌟", author: "Smart Attendance" },
  { quote: "Bạn đang làm công việc tuyệt vời nhất thế giới - định hình tương lai! 🚀", author: "Smart Attendance" },
  { quote: "Mỗi sinh viên là một câu chuyện, và bạn đang viết nên những chương tuyệt đẹp! 📖", author: "Smart Attendance" },
  { quote: "Năng lượng tích cực của bạn sẽ lan tỏa đến cả lớp học hôm nay! ☀️", author: "Smart Attendance" },
  { quote: "Đừng quên: bạn là nguồn cảm hứng cho hàng trăm sinh viên! 💪", author: "Smart Attendance" },
  { quote: "Kiến thức bạn truyền đạt hôm nay sẽ thay đổi thế giới ngày mai! 🌍", author: "Smart Attendance" },
  { quote: "Mỗi câu hỏi của sinh viên là cơ hội để bạn tỏa sáng! 💡", author: "Smart Attendance" },
  { quote: "Bạn không chỉ là giáo viên, bạn là người dẫn đường cho những ước mơ! 🎯", author: "Smart Attendance" },
];

const LecturerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [avgAttendance] = useState(85);
  
  // Random quote mỗi lần load trang
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    return motivationalQuotes[randomIndex];
  };
  const [currentQuote] = useState(getRandomQuote);

  useEffect(() => {
    fetchUpcomingSlots();
  }, []);

  const fetchUpcomingSlots = async () => {
    try {
      const res = await api.get("/lecturer/slots/upcoming");
      setAllSlots(res.data.data || []);
    } catch (err) {
      // Lỗi khi tải lịch dạy
    }
  };

  // Lấy ngày hôm nay dạng YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Lọc chỉ lấy slot trong ngày hôm nay
  const todaySlots = allSlots.filter(slot => {
    const slotDateStr = slot.date.split('T')[0];
    return slotDateStr === todayStr;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Tổng số slot hôm nay
  const totalSlotsToday = todaySlots.length;

  // Tìm slot tiếp theo (chưa bắt đầu hoặc đang diễn ra)
  const now = new Date();
  const getSlotTimes = (slot: Slot) => {
    const dateStr = slot.date.split('T')[0];
    const start = new Date(`${dateStr}T${slot.startTime}:00`);
    const end = new Date(`${dateStr}T${slot.endTime}:00`);
    return { start, end };
  };

  // Tìm slot gần nhất (đang diễn ra hoặc sắp tới)
  const nearestSlot = todaySlots.find(slot => {
    const { end } = getSlotTimes(slot);
    return now <= end; // Slot chưa kết thúc
  });

  // Tính thời gian còn lại đến slot tiếp theo
  const getTimeUntilNext = () => {
    if (!nearestSlot) return null;
    const { start, end } = getSlotTimes(nearestSlot);
    
    if (now >= start && now <= end) {
      // Đang diễn ra
      return { isHappening: true, minutes: 0 };
    } else if (now < start) {
      // Chưa bắt đầu - tính phút còn lại
      const minutes = Math.floor((start.getTime() - now.getTime()) / 60000);
      return { isHappening: false, minutes };
    }
    return null;
  };

  const timeInfo = getTimeUntilNext();

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
        .header-nav {
          background: white;
          border-bottom: 1px solid #E5E7EB;
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 0 1.5rem;
        }
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #FF7043, #FFAB91);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(255,112,67,0.3);
        }
        .logo-text {
          font-size: 18px;
          font-weight: 700;
          color: #1F2937;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .nav-link {
          font-size: 14px;
          font-weight: 500;
          color: #6B7280;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: #FF7043;
        }
        .nav-link.active {
          color: #FF7043;
          font-weight: 600;
        }
        .user-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .notification-btn {
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
        .notification-btn:hover {
          background: #F3F4F6;
        }
        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #FF7043;
          border-radius: 50%;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-left: 1rem;
          border-left: 1px solid #E5E7EB;
        }
        .user-details {
          text-align: right;
        }
        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: #1F2937;
        }
        .user-role {
          font-size: 12px;
          color: #6B7280;
        }
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF7043, #FFAB91);
          overflow: hidden;
        }
        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        /* Motivation Card Styles - Same height as stats cards */
        .motivation-card-inline {
          background: linear-gradient(135deg, #FF7043 0%, #FFAB91 100%);
          border-radius: 16px;
          padding: 1rem 1.25rem;
          position: relative;
          overflow: visible;
          box-shadow: 0 4px 15px rgba(255, 112, 67, 0.25);
          height: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        /* Running Character Container */
        .running-mascot {
          flex-shrink: 0;
          width: 55px;
          height: 55px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Character body with bounce */
        .mascot-body {
          position: relative;
          animation: run-bounce 0.25s ease-in-out infinite;
        }
        
        .mascot-emoji {
          font-size: 38px;
          display: block;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2));
        }
        
        @keyframes run-bounce {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-5px) rotate(3deg); }
        }
        
        /* Running legs */
        .mascot-legs {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
        }
        
        .mascot-leg {
          width: 6px;
          height: 12px;
          background: linear-gradient(to bottom, #FFB74D, #FF9800);
          border-radius: 3px;
          transform-origin: top center;
        }
        
        .mascot-leg-left { animation: leg-left 0.12s ease-in-out infinite; }
        .mascot-leg-right { animation: leg-right 0.12s ease-in-out infinite; }
        
        @keyframes leg-left {
          0%, 100% { transform: rotate(25deg); }
          50% { transform: rotate(-25deg); }
        }
        @keyframes leg-right {
          0%, 100% { transform: rotate(-25deg); }
          50% { transform: rotate(25deg); }
        }
        
        /* Floating hearts & likes */
        .floating-reactions {
          position: absolute;
          top: -10px;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: visible;
        }
        
        .reaction {
          position: absolute;
          font-size: 12px;
          animation: float-reaction 2s ease-out infinite;
          opacity: 0;
        }
        
        .reaction:nth-child(1) { left: 10%; animation-delay: 0s; }
        .reaction:nth-child(2) { left: 25%; animation-delay: 0.4s; }
        .reaction:nth-child(3) { left: 45%; animation-delay: 0.8s; }
        .reaction:nth-child(4) { left: 65%; animation-delay: 1.2s; }
        .reaction:nth-child(5) { left: 80%; animation-delay: 1.6s; }
        
        @keyframes float-reaction {
          0% { 
            opacity: 0; 
            transform: translateY(30px) scale(0.5); 
          }
          20% { 
            opacity: 1; 
            transform: translateY(15px) scale(1); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-25px) scale(0.8); 
          }
        }
        
        /* Dust/smoke behind running */
        .run-dust {
          position: absolute;
          left: -8px;
          bottom: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        
        .dust {
          width: 8px;
          height: 8px;
          background: rgba(255,255,255,0.6);
          border-radius: 50%;
          animation: dust-puff 0.4s ease-out infinite;
        }
        
        .dust:nth-child(2) { animation-delay: 0.1s; width: 6px; height: 6px; }
        .dust:nth-child(3) { animation-delay: 0.2s; width: 4px; height: 4px; }
        
        @keyframes dust-puff {
          0% { opacity: 0.8; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(-15px) scale(0.3); }
        }
        
        .motivation-text {
          flex: 1;
          min-width: 0;
        }
        
        .motivation-quote-inline {
          font-size: 13px;
          font-weight: 600;
          color: white;
          line-height: 1.45;
          text-shadow: 0 1px 2px rgba(0,0,0,0.15);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          animation: text-glow 2s ease-in-out infinite;
        }
        
        @keyframes text-glow {
          0%, 100% { 
            opacity: 1;
            text-shadow: 0 1px 2px rgba(0,0,0,0.15);
          }
          50% { 
            opacity: 0.85;
            text-shadow: 0 0 8px rgba(255,255,255,0.8), 0 0 15px rgba(255,255,255,0.5);
          }
        }
        
        /* Background decoration */
        .motivation-card-inline::before {
          content: '';
          position: absolute;
          top: -30px;
          right: -30px;
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.15);
          border-radius: 50%;
        }
        
        .motivation-card-inline::after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: -20px;
          width: 60px;
          height: 60px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
        }
        
        .motivation-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
          animation: shimmer 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-10%, 10%) rotate(5deg); }
        }
        
        /* Running Character Container */
        .runner-container {
          position: absolute;
          top: -35px;
          right: 15px;
          z-index: 10;
          width: 70px;
          height: 60px;
        }
        
        /* Cute Character */
        .cute-character {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          animation: cute-bounce 0.3s ease-in-out infinite;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
        }
        
        .cute-character-emoji {
          font-size: 45px;
          display: block;
        }
        
        @keyframes cute-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(-5deg); }
          50% { transform: translateX(-50%) translateY(-8px) rotate(5deg); }
        }
        
        /* Running Legs under character */
        .cute-legs {
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
        }
        
        .cute-leg {
          width: 8px;
          height: 16px;
          background: linear-gradient(to bottom, #FFB74D, #FF9800);
          border-radius: 4px;
          transform-origin: top center;
        }
        
        .cute-leg-left {
          animation: cute-leg-left 0.15s ease-in-out infinite;
        }
        
        .cute-leg-right {
          animation: cute-leg-right 0.15s ease-in-out infinite;
        }
        
        @keyframes cute-leg-left {
          0%, 100% { transform: rotate(40deg); }
          50% { transform: rotate(-40deg); }
        }
        
        @keyframes cute-leg-right {
          0%, 100% { transform: rotate(-40deg); }
          50% { transform: rotate(40deg); }
        }
        
        /* Smoke/Dust Effect */
        .smoke-container {
          position: absolute;
          bottom: 8px;
          left: 0px;
          display: flex;
          gap: 2px;
        }
        
        .smoke {
          width: 8px;
          height: 8px;
          background: rgba(200, 200, 200, 0.6);
          border-radius: 50%;
          animation: smoke-puff 0.4s ease-out infinite;
        }
        
        .smoke:nth-child(1) { animation-delay: 0s; }
        .smoke:nth-child(2) { animation-delay: 0.1s; width: 6px; height: 6px; }
        .smoke:nth-child(3) { animation-delay: 0.2s; width: 5px; height: 5px; }
        
        @keyframes smoke-puff {
          0% { transform: translateX(0) scale(0.5); opacity: 0.7; }
          100% { transform: translateX(-20px) translateY(-10px) scale(1); opacity: 0; }
        }
        
        /* Sparkles around character */
        .sparkles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        
        .sparkle {
          position: absolute;
          font-size: 10px;
          animation: sparkle-pop 1.5s ease-in-out infinite;
        }
        
        .sparkle:nth-child(1) { top: 5px; left: 5px; animation-delay: 0s; }
        .sparkle:nth-child(2) { top: 0px; right: 15px; animation-delay: 0.5s; }
        .sparkle:nth-child(3) { bottom: 15px; left: 10px; animation-delay: 1s; }
        
        @keyframes sparkle-pop {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 1; }
        }
        
        .motivation-quote {
          font-size: 15px;
          font-weight: 600;
          color: white;
          line-height: 1.7;
          margin-bottom: 0.75rem;
          position: relative;
          z-index: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .motivation-author {
          font-size: 12px;
          color: rgba(255,255,255,0.9);
          font-weight: 500;
        }
        
        .floating-hearts {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: visible;
        }
        
        .heart {
          position: absolute;
          font-size: 14px;
          animation: float-up 3s ease-in-out infinite;
          opacity: 0;
        }
        
        .heart:nth-child(1) { left: 10%; animation-delay: 0s; }
        .heart:nth-child(2) { left: 30%; animation-delay: 0.8s; }
        .heart:nth-child(3) { left: 50%; animation-delay: 1.6s; }
        .heart:nth-child(4) { left: 70%; animation-delay: 0.4s; }
        .heart:nth-child(5) { left: 90%; animation-delay: 1.2s; }
        
        @keyframes float-up {
          0% { 
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translateY(-20px) scale(1);
          }
          100% { 
            transform: translateY(-80px) scale(0.5);
            opacity: 0;
          }
        }
        
        /* Decorative Elements */
        .deco-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
        }
        
        .deco-circle-1 {
          width: 100px;
          height: 100px;
          bottom: -30px;
          right: -30px;
        }
        
        .deco-circle-2 {
          width: 60px;
          height: 60px;
          top: 40%;
          left: -20px;
        }
        
        .deco-circle-3 {
          width: 40px;
          height: 40px;
          top: 20%;
          right: 20px;
          animation: pulse-circle 2s ease-in-out infinite;
        }
        
        @keyframes pulse-circle {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.5; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#FFF8F5' }}>
        {/* Header Navigation */}
        <header className="header-nav">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon">
                <span className="material-icons-outlined" style={{ color: 'white', fontSize: '24px' }}>school</span>
              </div>
              <span className="logo-text">Smart Attendance</span>
            </div>

            <nav className="nav-links">
              <a href="/lecturer/dashboard" className="nav-link active">Trang chủ</a>
              <a href="/lecturer/schedule" className="nav-link">Lịch dạy</a>
              <a href="/lecturer/reports" className="nav-link">Báo cáo điểm danh</a>
            </nav>

            <div className="user-section">
              <button className="notification-btn">
                <span className="material-icons-outlined" style={{ color: '#6B7280', fontSize: '24px' }}>notifications</span>
                <span className="notification-dot"></span>
              </button>
              <div className="user-info">
                <div className="user-details">
                  <p className="user-name">{user?.fullName || 'Giảng viên'}</p>
                  <p className="user-role">Giảng viên</p>
                </div>
                <div className="user-avatar">
                  <img src="https://i.pravatar.cc/150?img=12" alt="Avatar" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Xin chào, <span className="text-orange-500">{user?.fullName || 'Giảng viên'}</span>
            </h1>
            <p className="text-gray-600">
              Bạn có <span className="font-semibold text-orange-500">{totalSlotsToday} slot</span> trong ngày hôm nay.
              {timeInfo && (
                timeInfo.isHappening 
                  ? <span className="text-green-600 font-semibold"> Đang có lớp diễn ra!</span>
                  : ` Slot tiếp theo bắt đầu sau ${timeInfo.minutes} phút.`
              )}
            </p>
          </div>

          {/* Stats Cards Row - 3 columns */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Card 1: Tổng số slot */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="material-icons-outlined text-blue-600 text-3xl">school</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Tổng số slot</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-3xl font-bold text-gray-800">{totalSlotsToday}</p>
                    <span className="text-xs text-gray-400">Hôm nay</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Tỷ lệ điểm danh */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="material-icons-outlined text-green-600 text-3xl">people</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Tỷ lệ điểm danh TB</p>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-gray-800">{avgAttendance}%</p>
                    <span className="text-xs text-green-600 font-semibold">↑ +2.4%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Motivation Quote */}
            <div className="motivation-card-inline">
              {/* Floating Hearts & Likes */}
              <div className="floating-reactions">
                <span className="reaction">💖</span>
                <span className="reaction">👍</span>
                <span className="reaction">💗</span>
                <span className="reaction">❤️</span>
                <span className="reaction">💕</span>
              </div>
              
              {/* Running Character */}
              <div className="running-mascot">
                {/* Dust behind */}
                <div className="run-dust">
                  <div className="dust"></div>
                  <div className="dust"></div>
                  <div className="dust"></div>
                </div>
                
                {/* Character */}
                <div className="mascot-body">
                  <span className="mascot-emoji">🏃</span>
                  {/* Legs */}
                  <div className="mascot-legs">
                    <div className="mascot-leg mascot-leg-left"></div>
                    <div className="mascot-leg mascot-leg-right"></div>
                  </div>
                </div>
              </div>
              
              {/* Quote Text */}
              <div className="motivation-text">
                <p className="motivation-quote-inline">
                  {currentQuote.quote}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Upcoming Classes - 2 columns */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Lịch dạy trong ngày</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-500 text-sm font-semibold flex items-center space-x-1">
                      <span className="material-icons-outlined text-base">today</span>
                      <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {todaySlots.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <span className="material-icons-outlined text-4xl mb-2 block">event_available</span>
                      <p>Không có slot nào trong ngày hôm nay</p>
                    </div>
                  ) : (
                    todaySlots.map((slot, idx) => {
                      const { start, end } = getSlotTimes(slot);
                      const isHappening = now >= start && now <= end;
                      const isPast = now > end;
                      const isNearest = nearestSlot?._id === slot._id;
                      
                      return (
                        <div
                          key={idx}
                          className={`border-l-4 rounded-lg p-4 hover:shadow-md transition ${
                            isHappening 
                              ? 'border-green-500 bg-green-50 shadow-md' 
                              : isNearest && !isPast
                                ? 'border-orange-500 bg-orange-50 shadow-sm'
                                : isPast
                                  ? 'border-gray-300 bg-gray-50 opacity-60'
                                  : 'border-orange-300 bg-orange-50/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`text-xs font-bold uppercase tracking-wide ${
                                  isHappening 
                                    ? 'text-green-600' 
                                    : isPast 
                                      ? 'text-gray-500'
                                      : 'text-orange-600'
                                }`}>
                                  {isHappening ? "● Đang diễn ra" : isPast ? "✓ Đã kết thúc" : "Bắt đầu"}
                                </span>
                                <span className="text-sm font-bold text-gray-800">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </div>
                              <h3 className="font-bold text-gray-800 text-lg mb-2">
                                {slot.subjectId.name} <span className="text-orange-500">({slot.subjectId.code})</span>
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <span className="material-icons-outlined text-base">place</span>
                                  <span>{slot.roomId.name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span className="material-icons-outlined text-base">people</span>
                                  <span>{slot.classId.name}</span>
                                </div>
                              </div>
                            </div>
                            <a
                              href={`/lecturer/attendance/generate?slotId=${slot._id}`}
                              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                                isHappening
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : isPast
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                              }`}
                            >
                              {isHappening ? 'Điểm danh' : isPast ? 'Đã kết thúc' : 'Chi tiết'}
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <a
                  href="/lecturer/schedule"
                  className="block text-center text-orange-600 hover:text-orange-700 font-semibold mt-6"
                >
                  Xem toàn bộ lịch dạy →
                </a>
              </div>
            </div>

            {/* Right Column: Alerts */}
            <div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                    <span className="material-icons-outlined text-orange-500">warning</span>
                    <span>Thông báo gần đây</span>
                  </h3>
                  <a href="#" className="text-sm text-orange-500 hover:text-orange-600">Xem tất cả</a>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <span className="material-icons-outlined text-red-500 text-xl">cancel</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">Tỷ lệ điểm danh thấp</p>
                      <p className="text-xs text-gray-600">Giải thuật nâng cao (CS402) giảm xuống dưới 70% ngưỡng cảnh báo.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <span className="material-icons-outlined text-orange-500 text-xl">pending</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">Chờ phê duyệt</p>
                      <p className="text-xs text-gray-600">5 sinh viên xin nghỉ môn "Cấu trúc dữ liệu".</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className="material-icons-outlined text-gray-500 text-xl">system_update</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">Cập nhật hệ thống</p>
                      <p className="text-xs text-gray-600">Bảo trì hệ thống lúc 02:00 sáng nay.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default LecturerDashboard;
