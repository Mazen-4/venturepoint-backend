import React, { useEffect, useState } from 'react';
import api from '../apiReequest';
import { FaEye } from 'react-icons/fa';

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyModal, setReplyModal] = useState({ open: false, message: null });
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replySuccess, setReplySuccess] = useState("");
  const [viewModal, setViewModal] = useState({ open: false, message: null });

  // Check if superadmin
  let isSuperAdmin = false;
  try {
    const { authAPI } = require('../utils/authUtils');
    isSuperAdmin = authAPI && typeof authAPI.hasRole === 'function' ? authAPI.hasRole('superadmin') : false;
  } catch (e) {
    // Silent fail
  }

  // Fetch messages on component mount
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch('/api/contact', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch messages');
        let data = await res.json();
        
        // Ensure read property is boolean (MySQL returns 0/1)
        data = data.map(msg => ({ ...msg, read: !!msg.read }));
        setMessages(data);
        const unread = data.filter(m => !m.read).length;
        setUnreadCount(unread);
        window.contactMessagesUnreadCount = unread;
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
  };

  // Mark message as read when viewing
  const handleViewMessage = async (msg) => {
    setViewModal({ open: true, message: msg });
    if (!msg.read) {
      try {
        await api.post(`/contact/${msg.id}/read`);
      } catch (err) {
        // Silent fail
      }
    }
    setMessages(prev => {
      const updated = prev.map(m => m.id === msg.id ? { ...m, read: true } : m);
      const unread = updated.filter(m => !m.read).length;
      setUnreadCount(unread);
      window.contactMessagesUnreadCount = unread;
      return updated;
    });
  };

  // Handle mark as unread
  const handleMarkUnread = async (msgId) => {
    try {
      await api.post(`/contact/${msgId}/unread`);
    } catch (err) {
      // Silent fail
    }
    setMessages(prev => {
      const updated = prev.map(m => m.id === msgId ? { ...m, read: false } : m);
      const unread = updated.filter(m => !m.read).length;
      setUnreadCount(unread);
      window.contactMessagesUnreadCount = unread;
      return updated;
    });
  };

  // Handle reply via Gmail
  const handleReplySubmit = (e) => {
    e.preventDefault();
    const to = encodeURIComponent(replyModal.message.email);
    const subject = encodeURIComponent(replySubject);
    const body = encodeURIComponent(replyBody);
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`,
      '_blank'
    );
    setReplyModal({ open: false, message: null });
  };

  // Handle opening reply modal
  const handleOpenReply = (msg) => {
    setReplyModal({ open: true, message: msg });
    setReplySubject(`Re: ${msg.subject || 'Contact Form Message'}`);
    setReplyBody(`Hi ${msg.name},\n\nThank you for contacting us. Regarding your message:\n\n"${msg.message}"\n\n---\nYour reply here.`);
    setReplyError("");
    setReplySuccess("");
  };

  return (
    <div className="p-2 sm:p-4 md:p-8 w-full max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Contact Messages {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              {unreadCount} unread
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isSuperAdmin ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}`}>
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-lg">Loading messages...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Messages Table */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-2xl overflow-x-auto border-2 border-blue-200 w-full">
          <table className="min-w-full text-sm md:text-base">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-gray-700">ID</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Name</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Email</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Subject</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Message</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Date</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Status</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 px-4 text-center text-gray-500">
                    <div className="text-lg">No messages found</div>
                    <div className="text-sm mt-1">Contact messages will appear here when received.</div>
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id} className={`hover:bg-blue-50 transition-colors ${!msg.read ? 'bg-blue-25' : ''}`}>
                    <td className="py-4 px-4 font-medium text-gray-900">{msg.id}</td>
                    <td className="py-4 px-4 font-medium text-gray-900">{msg.name}</td>
                    <td className="py-4 px-4 font-medium text-gray-900">{msg.email}</td>
                    <td className="py-4 px-4 max-w-xs truncate" title={msg.subject}>{msg.subject}</td>
                    <td className="py-4 px-4 max-w-xs truncate whitespace-pre-line break-words" title={msg.message}>
                      {msg.message}
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      {msg.read ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Read
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          Unread
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-2 items-stretch justify-center">
                        <button
                          onClick={() => handleViewMessage(msg)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-blue-700 text-base md:text-sm lg:text-base xl:text-lg flex items-center justify-center gap-1"
                          style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
                        >
                          <FaEye className="text-sm" /> View
                        </button>
                        <button
                          onClick={() => handleOpenReply(msg)}
                          className="px-3 py-1 bg-green-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-green-700 text-base md:text-sm lg:text-base xl:text-lg flex items-center justify-center gap-1"
                          style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
                        >
                          <span role="img" aria-label="reply">✉️</span> Reply
                        </button>
                        <button
                          onClick={() => handleMarkUnread(msg.id)}
                          className="px-3 py-1 bg-yellow-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-yellow-700 text-base md:text-sm lg:text-base xl:text-lg"
                          style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
                        >
                          Mark Unread
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {viewModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <FaEye className="text-blue-600 text-xl" />
              <h3 className="text-xl font-bold text-blue-700">Message Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <strong className="text-gray-700">Name:</strong>
                <div className="text-gray-900">{viewModal.message.name}</div>
              </div>
              <div>
                <strong className="text-gray-700">Email:</strong>
                <div className="text-gray-900">{viewModal.message.email}</div>
              </div>
              <div>
                <strong className="text-gray-700">Subject:</strong>
                <div className="text-gray-900">{viewModal.message.subject}</div>
              </div>
              <div>
                <strong className="text-gray-700">Date:</strong>
                <div className="text-gray-900">{new Date(viewModal.message.created_at).toLocaleString()}</div>
              </div>
              <div>
                <strong className="text-gray-700">Message:</strong>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-gray-800 whitespace-pre-line">
                  {viewModal.message.message}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setViewModal({ open: false, message: null })}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewModal({ open: false, message: null });
                  handleOpenReply(viewModal.message);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-blue-700">
              Reply to {replyModal.message.name}
            </h3>
            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="email"
                  value={replyModal.message.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="6"
                  required
                />
              </div>
              {replyError && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                  {replyError}
                </div>
              )}
              {replySuccess && (
                <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded">
                  {replySuccess}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={() => setReplyModal({ open: false, message: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send via Gmail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { AdminContactMessages };