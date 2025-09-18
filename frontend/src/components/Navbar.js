import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/authUtils';
import { FaHome, FaInfoCircle, FaServicestack, FaEnvelope, FaUserShield, FaSignInAlt, FaBars, FaTimes } from 'react-icons/fa';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const authenticated = authAPI.hasRole('admin') || authAPI.hasRole('superadmin');

  const location = useLocation();
  const navLinks = [
    { name: 'Home', path: '/', icon: <FaHome /> },
    { name: 'About', path: '/about', icon: <FaInfoCircle /> },
    { name: 'Services', path: '/services', icon: <FaServicestack /> },
    { name: 'Contact', path: '/contact', icon: <FaEnvelope /> },
  ];

  return (
    <motion.nav
  initial={{ opacity: 0, scale: 0.96, y: -20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
  className="sticky top-0 z-50 w-full max-w-full sm:w-[95%] mx-auto font-inter backdrop-blur-lg bg-navy/80 shadow-xl transition-all duration-500 rounded-b-3xl"
>


  <div className="w-full px-2 sm:px-4 lg:px-8">
  <div className="flex flex-wrap justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={(process.env.REACT_APP_API_URL || "https://venturepoint-backend.onrender.com") + '/images/VPED-logo.png'}
                alt="VenturePoint Logo"
                className="h-10 w-auto object-contain animate-spin-slow group-hover:scale-110 transition-transform duration-500"
                style={{ maxHeight: '40px' }}
              />
              <span className="text-2xl sm:text-3xl font-extrabold tracking-wide text-gold drop-shadow-lg animate-gradient-x" style={{letterSpacing: '0.05em'}}>VenturePoint</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 relative ${isActive ? 'text-gold font-bold' : 'text-gray-50 hover:text-gold'} group`}
                  >
                    <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{link.icon}</span>
                    {link.name}
                    {isActive && (
                      <span className="absolute left-0 bottom-0 w-full h-1 bg-gradient-to-r from-gold to-emerald rounded-full animate-underline"></span>
                    )}
                  </Link>
                );
              })}
              {/* Admin Button */}
              <div className="ml-4 pl-4 border-l border-gold">
                {authenticated ? (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 bg-gold text-navy px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald hover:text-white transition-colors shadow-md"
                  >
                    <FaUserShield className="text-lg" /> Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/admin/login"
                    className="flex items-center gap-2 bg-gray-900 text-gold px-4 py-2 rounded-md text-sm font-medium hover:bg-gold hover:text-navy transition-colors shadow-md"
                  >
                    <FaSignInAlt className="text-lg" /> Admin Login
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gold hover:text-gray-50 focus:outline-none focus:text-gold transition-transform duration-300"
            >
              {isMenuOpen ? (
                <FaTimes className="h-8 w-8 animate-fade-in" />
              ) : (
                <FaBars className="h-8 w-8 animate-fade-in" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden animate-slide-down">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-navy/90 backdrop-blur-lg shadow-lg rounded-b-xl">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-2 text-base font-medium block px-3 py-2 rounded-md transition-all duration-300 relative ${isActive ? 'text-gold font-bold' : 'text-gray-50 hover:text-gold'} group`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{link.icon}</span>
                  {link.name}
                  {isActive && (
                    <span className="absolute left-0 bottom-0 w-full h-1 bg-gradient-to-r from-gold to-emerald rounded-full animate-underline"></span>
                  )}
                </Link>
              );
            })}
            {/* Mobile Admin Button */}
            <div className="border-t border-gold pt-2 mt-2">
              {authenticated ? (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 bg-gold text-navy block px-3 py-2 rounded-md text-base font-medium hover:bg-emerald hover:text-white shadow-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaUserShield className="text-lg" /> Dashboard
                </Link>
              ) : (
                <Link
                  to="/admin/login"
                  className="flex items-center gap-2 bg-gray-900 text-gold block px-3 py-2 rounded-md text-base font-medium hover:bg-gold hover:text-navy shadow-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaSignInAlt className="text-lg" /> Admin Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  );
}
// Custom animations (add to your global CSS or Tailwind config)
// .animate-spin-slow { animation: spin 4s linear infinite; }
// .animate-gradient-x { animation: gradient-x 3s ease-in-out infinite alternate; }
// .animate-fade-in { animation: fadeIn 0.5s ease; }
// .animate-slide-down { animation: slideDown 0.4s cubic-bezier(0.4,0,0.2,1); }