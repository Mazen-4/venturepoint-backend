import React from 'react';
import ReactDOM from 'react-dom';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/authUtils';
import { FaHome, FaUserShield, FaUsers, FaServicestack, FaProjectDiagram, FaCalendarAlt, FaNewspaper, FaEnvelope } from 'react-icons/fa';

// Sidebar navigation items
const navItems = [
  { name: 'Dashboard Home', path: '/admin', icon: <FaHome className="text-blue-700" /> },
  { name: 'Admin Management', path: '/admin/admin-management', icon: <FaUserShield className="text-blue-700" /> },
  { name: 'Members Management', path: '/admin/members', icon: <FaUsers className="text-blue-700" /> },
  { name: 'Services', path: '/admin/services', icon: <FaServicestack className="text-blue-700" /> },
  { name: 'Projects', path: '/admin/projects', icon: <FaProjectDiagram className="text-blue-700" /> },
  { name: 'Events', path: '/admin/events', icon: <FaCalendarAlt className="text-blue-700" /> },
  { name: 'Articles', path: '/admin/articles', icon: <FaNewspaper className="text-blue-700" /> },
  { name: 'Contact Messages', path: '/admin/contact-messages', icon: <FaEnvelope className="text-blue-700" /> },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const isAdmin = authAPI.hasRole('admin') || authAPI.hasRole('superadmin');

  const handleLogout = () => {
    authAPI.logout();
    navigate('/admin/login');
  };

  // Use global unread count from contact messages
  const [unreadCount, setUnreadCount] = React.useState(window.contactMessagesUnreadCount || 0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setUnreadCount(window.contactMessagesUnreadCount || 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // State for mobile sidebar drawer
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <>
      {/* Floating Contact Messages Button rendered via portal */}
      {isAdmin && ReactDOM.createPortal(
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
          <button
            className="bg-gradient-to-br from-blue-600 to-emerald-400 text-white rounded-full shadow-2xl w-16 h-16 flex items-center justify-center hover:scale-110 transition-transform duration-300 border-4 border-white/70 backdrop-blur-lg animate-float relative"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
            onClick={() => window.location.href = '/admin/contact-messages'}
            aria-label="Contact Messages"
          >
            <FaEnvelope className="text-3xl animate-bounce" />
            <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-2 py-1 text-xs font-bold shadow-lg">
              {unreadCount}
            </span>
          </button>
        </div>,
        document.body
      )}

  <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 animate-fadein rounded-3xl landscape:flex-row flex-col">
        {/* Sidebar for desktop */}
  <aside className="hidden md:flex flex-col w-72 bg-white/90 backdrop-blur-lg shadow-2xl p-8 rounded-3xl animate-slidein-left transition-all duration-700 border-2 border-blue-200 fixed h-full z-30 landscape:static landscape:relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-extrabold text-green-600 drop-shadow-lg tracking-wide animate-fadein">Admin Panel</h2>
          </div>
          <nav className="flex-1">
            <ul className="space-y-2">
              {navItems.map((item, idx) => (
                <li key={item.name} className="animate-fadein" style={{ animationDelay: `${idx * 0.07}s` }}>
                  <Link
                    to={item.path}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-blue-200 hover:scale-105 text-blue-900 font-semibold transition-all duration-300 shadow-sm border border-blue-100"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {/* Logout button at bottom of sidebar */}
          <div className="mt-auto pt-6 border-t">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-red-300"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Hamburger menu for mobile landscape */}
        <button
          className="md:hidden fixed top-2 left-2 z-50 bg-white rounded-full p-3 shadow-xl border-2 border-blue-400 hover:scale-105 hover:shadow-emerald/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Sidebar drawer overlay for mobile landscape */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex flex-col">
            {/* Overlay background */}
            <div
              className="bg-black/50 flex-1 animate-fadein"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            />
            {/* Sidebar drawer */}
            <aside className="w-72 bg-gray-900 text-white p-8 flex flex-col animate-slidein-left transition-all duration-700 rounded-3xl shadow-2xl border-2 border-blue-800 fixed top-0 left-0 h-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold text-emerald-300 drop-shadow-lg tracking-wide">Admin Panel</h2>
                <button
                  className="text-white text-2xl ml-2 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
                </button>
              </div>
              <nav className="flex-1">
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-blue-800 hover:scale-105 text-white font-semibold transition-all duration-300 shadow-sm border border-blue-800"
                        onClick={() => setSidebarOpen(false)}
                      >
                        {item.icon}
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-auto pt-6 border-t border-blue-800">
                <button
                  onClick={() => { setSidebarOpen(false); handleLogout(); }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-red-300"
                >
                  Logout
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content (changes with nested routes) */}
        <main className="flex-1 p-4 md:p-10 transition-all duration-700 md:ml-72 landscape:p-8 landscape:ml-72 flex flex-col justify-center items-center" style={{marginLeft: 0}}>
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-2 md:p-8 min-h-[70vh] border-2 border-blue-200 w-full max-w-screen-2xl flex flex-col justify-center items-center" style={{marginLeft: 0}}>
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}