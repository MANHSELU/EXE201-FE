import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
      color: 'white',
      padding: '3rem 1.5rem 1.5rem',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Main Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Brand Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #FF7043, #FFAB91)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span className="material-icons-outlined" style={{ color: 'white', fontSize: '24px' }}>school</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 700 }}>Smart Attendance</span>
            </div>
            <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: 1.6 }}>
              Hệ thống điểm danh thông minh sử dụng công nghệ nhận diện khuôn mặt và QR Code.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '1rem', color: '#FF7043' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/lecturer/dashboard" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}>Dashboard</a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/lecturer/schedule" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px' }}>Schedule</a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/lecturer/reports" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px' }}>Reports</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '1rem', color: '#FF7043' }}>Contact</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-icons-outlined" style={{ fontSize: '18px', color: '#FF7043' }}>email</span>
                <span style={{ color: '#9CA3AF', fontSize: '14px' }}>support@smartattendance.vn</span>
              </li>
              <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-icons-outlined" style={{ fontSize: '18px', color: '#FF7043' }}>phone</span>
                <span style={{ color: '#9CA3AF', fontSize: '14px' }}>1900 1234</span>
              </li>
              <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-icons-outlined" style={{ fontSize: '18px', color: '#FF7043' }}>location_on</span>
                <span style={{ color: '#9CA3AF', fontSize: '14px' }}>FPT University, HCM</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '1rem', color: '#FF7043' }}>Follow Us</h4>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a href="#" style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 112, 67, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}>
                <span style={{ color: '#FF7043', fontSize: '20px' }}>📘</span>
              </a>
              <a href="#" style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 112, 67, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#FF7043', fontSize: '20px' }}>📸</span>
              </a>
              <a href="#" style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 112, 67, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#FF7043', fontSize: '20px' }}>🔗</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          borderTop: '1px solid #374151',
          paddingTop: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            © {currentYear} Smart Attendance. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" style={{ fontSize: '14px', color: '#6B7280', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ fontSize: '14px', color: '#6B7280', textDecoration: 'none' }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
