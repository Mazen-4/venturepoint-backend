
import React, { useEffect, useState, useCallback } from 'react';
import { authAPI, serviceAPI } from '../utils/authUtils';
import { useNavigate } from 'react-router-dom';

export default function AdminServices() {
  // =======================
  // State Declarations
  // =======================
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', description: '' });
  const [addError, setAddError] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', title: '', description: '' });
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // =======================
  // Helper Functions
  // =======================
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const checkUserRole = () => {
    try {
      const hasSuperAdminRole = authAPI.hasRole('superadmin');
      setIsSuperAdmin(hasSuperAdminRole);
    } catch (err) {
      setIsSuperAdmin(false);
    }
  };

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceAPI.getServices();
      setServices(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        authAPI.logout();
        navigate('/admin/login');
      } else {
        setError(err.message || 'Failed to fetch services');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkUserRole();
    fetchServices();
  }, [fetchServices]);

  // =======================
  // Form Handlers
  // =======================
  const handleAddInput = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      await serviceAPI.createService(addForm);
      setShowAddModal(false);
      setAddForm({ title: '', description: '' });
      showSuccess('Service added successfully!');
      fetchServices();
    } catch (err) {
      setAddError(err.message || 'Failed to add service');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditClick = (service) => {
    setEditForm({ id: service.id, title: service.title, description: service.description });
    setShowEditModal(true);
    setEditError(null);
  };

  const handleEditInput = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      const { id, ...updateData } = editForm;
      await serviceAPI.updateService(id, updateData);
      setShowEditModal(false);
      showSuccess('Service updated successfully!');
      fetchServices();
    } catch (err) {
      setEditError(err.message || 'Failed to update service');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteService = async (serviceId, serviceName) => {
    if (!isSuperAdmin) {
      alert('Access denied. Only superadmin can delete services.');
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete "${serviceName}"? This action cannot be undone.`);
    if (!confirmDelete) return;
    setDeleteLoading(serviceId);
    setError(null);
    try {
      await serviceAPI.deleteService(serviceId);
      setServices(prevServices => prevServices.filter(service => service.id !== serviceId));
      showSuccess('Service deleted successfully!');
    } catch (error) {
      if (error.response?.status === 403) {
        setError('Access denied. Superadmin role required to delete services.');
      } else if (error.response?.status === 404) {
        setError('Service not found.');
      } else if (error.response?.status === 401) {
        setError('Please log in again.');
        authAPI.logout();
        navigate('/admin/login');
      } else {
        setError(error.message || 'Failed to delete service');
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/admin/login');
  };

  // =======================
  // Render
  // =======================
  return (
    <div className="p-2 sm:p-4 md:p-8 w-full max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Services</h2>
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

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-blue-700 font-medium"
        onClick={() => setShowAddModal(true)}
      >
        + Add New Service
      </button>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add New Service</h3>
            <form onSubmit={handleAddSubmit}>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  name="title"
                  value={addForm.title}
                  onChange={handleAddInput}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={addForm.description}
                  onChange={handleAddInput}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
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
                  className="px-3 py-1 bg-gray-400 text-white rounded-xl cursor-not-allowed"
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
                  className="px-3 py-1 bg-blue-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-blue-700"
                  style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
                  disabled={addLoading}
                >
                  {addLoading ? 'Adding...' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Service</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditInput}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditInput}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>
              {editError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                  {editError}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-3 py-1 bg-gray-400 text-white rounded-xl cursor-not-allowed"
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
                  className="px-3 py-1 bg-green-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-green-700"
                  style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
                  disabled={editLoading}
                >
                  {editLoading ? 'Updating...' : 'Update Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-lg">Loading...</div>
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-2xl shadow-2xl overflow-x-auto border-2 border-blue-200 w-full">
          <table className="min-w-full text-base md:text-sm lg:text-base xl:text-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-gray-700">ID</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Title</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Description</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {services.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 px-4 text-center text-gray-500">
                    <div className="text-lg">No services found</div>
                    <div className="text-sm mt-1">Add your first service to get started!</div>
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-blue-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900">{service.id}</td>
                    <td className="py-4 px-4 font-medium text-gray-900">{service.title}</td>
                    <td className="py-4 px-4 max-w-xs truncate whitespace-pre-line break-words" title={service.description}>{service.description}</td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-2 items-stretch justify-center">
                        <button
                          onClick={() => handleEditClick(service)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-blue-700 text-base md:text-sm lg:text-base xl:text-lg"
                          style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
                        >
                          Edit
                        </button>
                        {isSuperAdmin ? (
                          <button
                            onClick={() => handleDeleteService(service.id, service.title)}
                            disabled={deleteLoading === service.id}
                            className="px-3 py-1 bg-red-600 text-white rounded-xl hover:scale-105 shadow-lg disabled:opacity-50 transition-all duration-300 border border-red-700 text-base md:text-sm lg:text-base xl:text-lg"
                            style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
                          >
                            {deleteLoading === service.id ? 'Deleting...' : 'Delete'}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1 bg-gray-400 text-white rounded-xl cursor-not-allowed text-base md:text-sm lg:text-base xl:text-lg"
                            title="Superadmin role required to delete services"
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
