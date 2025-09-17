import React, { useState } from 'react';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
// Import your logo if available
const logo = process.env.PUBLIC_URL + '/images/VPED-logo.png';


export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        navigate('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 rounded-2xl py-12 px-4 sm:px-6 lg:px-8 font-sans transition-all duration-500">
      <div className="backdrop-blur-lg bg-white/30 border border-white/40 rounded-2xl shadow-lg w-full max-w-md p-8 animate-fadein" style={{ fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="VPED Logo" className="h-24 mb-4" />
          <h2 className="text-3xl font-bold text-blue-900 mb-2">VPED Admin Login</h2>
          <p className="text-sm text-blue-700">Access your admin dashboard</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-blue-900 mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400">
                  <FaUser />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full pl-10 pr-4 py-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-blue-900 placeholder-blue-400 bg-blue-50"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blue-900 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400">
                  <FaLock />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-10 pr-4 py-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-blue-900 placeholder-blue-400 bg-blue-50"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-100 p-3">
              <div className="text-sm text-red-700 text-center">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 text-white font-semibold rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ transition: 'transform 0.2s, background 0.2s' }}
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
            ) : (
              <FaSignInAlt className="mr-2" />
            )}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-8 text-center text-blue-900 text-xs opacity-70">
          &copy; {new Date().getFullYear()} VPED. All rights reserved.
        </div>
      </div>
    </div>
  );
}