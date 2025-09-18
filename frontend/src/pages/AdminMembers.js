import React, { useEffect, useState, useCallback } from 'react';
import { authAPI, memberAPI } from '../utils/authUtils';
import { useNavigate } from 'react-router-dom';

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', role: '', bio: '', photo_url: '' });
  const [editImage, setEditImage] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', role: '', bio: '' });
  const [addImage, setAddImage] = useState(null);
  const [addError, setAddError] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setIsSuperAdmin(authAPI.hasRole('superadmin'));
    setIsAdmin(authAPI.hasRole('admin'));
  }, []);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await memberAPI.getMembers();
      setMembers(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Success message helper
  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Add member handlers
  const handleAddInput = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };
  const handleAddImage = (e) => {
    setAddImage(e.target.files[0]);
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      const formData = new FormData();
      formData.append('name', addForm.name);
      formData.append('role', addForm.role);
      formData.append('bio', addForm.bio);
      if (addImage) {
        formData.append('photo', addImage);
      }
      await memberAPI.createMember(formData, true); // true = multipart
      setShowAddModal(false);
      setAddForm({ name: '', role: '', bio: '' });
      setAddImage(null);
      showSuccess('Member added successfully!');
      fetchMembers();
    } catch (err) {
      setAddError(err.message || 'Failed to add member');
    } finally {
      setAddLoading(false);
    }
  };

  // Edit member handlers
  const handleEditClick = (member) => {
    setEditForm({ id: member.id, name: member.name, role: member.role, bio: member.bio, photo_url: member.photo_url || '' });
    setEditImage(null);
    setShowEditModal(true);
    setEditError(null);
  };
  const handleEditInput = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditImage = (e) => {
    setEditImage(e.target.files[0]);
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('role', editForm.role);
      formData.append('bio', editForm.bio);
      if (editImage) {
        formData.append('photo', editImage);
      }
      await memberAPI.updateMember(editForm.id, formData, true); // true = multipart
      setShowEditModal(false);
      showSuccess('Member updated successfully!');
      fetchMembers();
    } catch (err) {
      setEditError(err.message || 'Failed to update member');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete member
  const handleDeleteMember = async (memberId, memberName) => {
    if (!isSuperAdmin) {
      alert('Access denied. Only superadmin can delete members.');
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete "${memberName}"? This action cannot be undone.`);
    if (!confirmDelete) return;
    setDeleteLoading(memberId);
    setError(null);
    try {
      await memberAPI.deleteMember(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      showSuccess('Member deleted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to delete member');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Logout
  const handleLogout = () => {
    authAPI.logout();
    navigate('/admin/login');
  };

  // Permission logic
  const canEdit = isSuperAdmin || isAdmin;
  const canAdd = isSuperAdmin;
  const canDelete = isSuperAdmin;

  return (
  <div className="w-full max-w-screen-2xl mx-auto px-1 md:px-4 py-4 mt-2 landscape:px-8 landscape:py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 md:gap-0">
        <h2 className="text-3xl md:text-4xl font-bold text-navy drop-shadow-lg">Members Management</h2>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isSuperAdmin ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}`}>{isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'User'}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-red-300"
          >
            Logout
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {canAdd && (
        <button
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-blue-700 font-medium"
          onClick={() => setShowAddModal(true)}
        >
          + Add New Member
        </button>
      )}

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add New Member</h3>
            <form onSubmit={handleAddSubmit}>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={addForm.name}
                  onChange={handleAddInput}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  name="role"
                  value={addForm.role}
                  onChange={handleAddInput}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={addForm.bio}
                  onChange={handleAddInput}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">Photo</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleAddImage}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {addError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                  {addError}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError(null);
                  }}
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  disabled={addLoading}
                >
                  {addLoading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Member</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditInput}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  name="role"
                  value={editForm.role}
                  onChange={handleEditInput}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleEditInput}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">Photo</label>
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={handleEditImage}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editForm.photo_url && (
                  <div className="mt-2">
                    <img
                      src={
                        editForm.photo_url.startsWith('/images/')
                          ? `${process.env.REACT_APP_API_BASE_URL || "https://venturepoint-backend.onrender.com"}${editForm.photo_url}`
                          : `${process.env.REACT_APP_API_URL || "https://venturepoint-backend.onrender.com"}/images/${editForm.photo_url.replace(/^.*[\\/]/, '')}`
                      }
                      alt="Current"
                      className="h-12 w-12 object-cover rounded-full border"
                    />
                  </div>
                )}
              </div>
              {editError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                  {editError}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditError(null);
                  }}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  disabled={editLoading}
                >
                  {editLoading ? 'Updating...' : 'Update Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-lg">Loading members...</div>
        </div>
      )}

      {!loading && (
  <div className="bg-white rounded-2xl shadow-2xl overflow-x-auto border-2 border-blue-200 w-full mr-4">
          <table className="min-w-full text-sm md:text-base">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-gray-700">ID</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Name</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Role</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Bio</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Photo</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 px-4 text-center text-gray-500">
                    <div className="text-lg">No members found</div>
                    <div className="text-sm mt-1">Add your first member to get started!</div>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-blue-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900">{member.id}</td>
                    <td className="py-4 px-4 font-medium text-gray-900">{member.name}</td>
                    <td className="py-4 px-4">{member.role}</td>
                    <td className="py-4 px-4 max-w-xs truncate whitespace-pre-line break-words" title={member.bio}>{member.bio}</td>
                    <td className="py-4 px-4">
                      {member.photo_url ? (
                        <img
                          src={
                            member.photo_url.startsWith('/images/')
                              ? `${process.env.REACT_APP_API_BASE_URL || "https://venturepoint-backend.onrender.com"}${member.photo_url}`
                              : `${process.env.REACT_APP_API_URL || "https://venturepoint-backend.onrender.com"}/images/${member.photo_url.replace(/^.*[\\/]/, '')}`
                          }
                          alt={member.name}
                          className="h-12 w-12 object-cover rounded-full border"
                        />
                      ) : (
                        <span className="text-gray-400">No photo</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-2 items-stretch justify-center">
                        {canEdit && (
                          <button
                            onClick={() => handleEditClick(member)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-blue-700 text-base md:text-sm lg:text-base xl:text-lg"
                            style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
                          >
                            Edit
                          </button>
                        )}
                        {canDelete ? (
                          <button
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            disabled={deleteLoading === member.id}
                            className="px-3 py-1 bg-red-600 text-white rounded-xl hover:scale-105 shadow-lg disabled:opacity-50 transition-all duration-300 border border-red-700 text-base md:text-sm lg:text-base xl:text-lg"
                            style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
                          >
                            {deleteLoading === member.id ? 'Deleting...' : 'Delete'}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1 bg-gray-400 text-white rounded-xl cursor-not-allowed text-base md:text-sm lg:text-base xl:text-lg"
                            title="Superadmin role required to delete members"
                            style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
