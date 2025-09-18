import React, { useEffect, useState, useCallback } from 'react';
import { authAPI, projectAPI } from '../utils/authUtils';
import { useNavigate } from 'react-router-dom';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Add Project Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    region: '',
    start_date: '',
    end_date: ''
  });
  const [addImage, setAddImage] = useState(null);
  const [addError, setAddError] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  // Edit Project Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    description: '',
    region: '',
    start_date: '',
    end_date: ''
  });
  const [editImage, setEditImage] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  
  // Delete States
  const [deleteLoading, setDeleteLoading] = useState(null);
  
  // Success Messages
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  const checkUserRole = () => {
    try {
      const hasSuperAdminRole = authAPI.hasRole('superadmin');
      setIsSuperAdmin(hasSuperAdminRole);
      console.log('User is superadmin:', hasSuperAdminRole);
    } catch (err) {
      console.error('Error checking user role:', err);
      setIsSuperAdmin(false);
    }
  };

  // Fetch projects with authentication
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectAPI.getProjects();
      setProjects(response.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        authAPI.logout();
        navigate('/admin/login');
      } else {
        setError(err.message || 'Failed to fetch projects');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkUserRole();
    fetchProjects();
  }, [fetchProjects]);

  // Show success message helper
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Handle add form input
  const handleAddInput = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleAddImage = (e) => {
    setAddImage(e.target.files[0]);
  };

  // Handle add form submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);

    try {
      if (addImage && addImage.size > 100 * 1024 * 1024) {
        setAddError('Image is too big. Please upload an image less than 100 MB.');
        setAddLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('name', addForm.name);
      formData.append('description', addForm.description);
      formData.append('region', addForm.region);
      formData.append('start_date', addForm.start_date);
      formData.append('end_date', addForm.end_date);
      if (addImage) {
        formData.append('image', addImage); // backend expects 'image' for image_url
      }
      await projectAPI.createProject(formData, true); // true = multipart
      setShowAddModal(false);
      setAddForm({
        name: '',
        description: '',
        region: '',
        start_date: '',
        end_date: ''
      });
      setAddImage(null);
      showSuccess('Project added successfully!');
      fetchProjects();
    } catch (err) {
      setAddError(err.message || 'Failed to add project');
    } finally {
      setAddLoading(false);
    }
  };

  // Handle edit button click
  const handleEditClick = (project) => {
    setEditForm({
      id: project.id,
      name: project.name,
      description: project.description,
      region: project.region,
      start_date: project.start_date ? project.start_date.slice(0, 10) : '',
      end_date: project.end_date ? project.end_date.slice(0, 10) : ''
    });
    setShowEditModal(true);
    setEditError(null);
  };

  const handleEditImage = (e) => {
    setEditImage(e.target.files[0]);
  };

  // Handle edit form input
  const handleEditInput = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    try {
      if (editImage && editImage.size > 100 * 1024 * 1024) {
        setEditError('Image is too big. Please upload an image less than 100 MB.');
        setEditLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('description', editForm.description);
      formData.append('region', editForm.region);
      formData.append('start_date', editForm.start_date);
      formData.append('end_date', editForm.end_date);
      if (editImage) {
        formData.append('image', editImage); // backend expects 'image' for image_url
      }
      await projectAPI.updateProject(editForm.id, formData, true); // true = multipart
      setShowEditModal(false);
      setEditImage(null);
      showSuccess('Project updated successfully!');
      fetchProjects();
    } catch (err) {
      setEditError(err.message || 'Failed to update project');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete - FIXED: Proper implementation with superadmin check
  const handleDeleteProject = async (projectId, projectName) => {
    // Check if user is superadmin before allowing delete
    if (!isSuperAdmin) {
      alert('Access denied. Only superadmin can delete projects.');
      return;
    }

    // Double confirmation for delete
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${projectName}"? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    setDeleteLoading(projectId);
    setError(null);

    try {
      console.log('Attempting to delete project:', projectId);
      await projectAPI.deleteProject(projectId);
      
      // Remove project from local state immediately for better UX
      setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
      
      showSuccess('Project deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      
      if (error.response?.status === 403) {
        setError('Access denied. Superadmin role required to delete projects.');
      } else if (error.response?.status === 404) {
        setError('Project not found.');
      } else if (error.response?.status === 401) {
        setError('Please log in again.');
        authAPI.logout();
        navigate('/admin/login');
      } else {
        setError(error.message || 'Failed to delete project');
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  // Logout function
  const handleLogout = () => {
    authAPI.logout();
    navigate('/admin/login');
  };

  return (
  <div className="w-full max-w-screen-2xl mx-auto px-1 md:px-4 py-4 landscape:px-8 landscape:py-8 bg-transparent">
  <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3 md:gap-0 pr-4 md:pr-8">
        <h2 className="text-3xl md:text-4xl font-bold text-navy drop-shadow-lg">Manage Projects</h2>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isSuperAdmin 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-blue-100 text-blue-800 border border-blue-300'
          }`}>
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
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      <button
        className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-blue-700 font-medium"
        onClick={() => setShowAddModal(true)}
      >
        + Add New Project
      </button>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add New Project</h3>
            <form onSubmit={handleAddSubmit}>
              {addError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
                  {addError}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={addForm.name}
                  onChange={handleAddInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={addForm.description}
                  onChange={handleAddInput}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input
                  type="text"
                  name="region"
                  value={addForm.region}
                  onChange={handleAddInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={addForm.start_date}
                  onChange={handleAddInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  name="end_date"
                  value={addForm.end_date}
                  onChange={handleAddInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleAddImage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {addLoading ? 'Adding...' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Project</h3>
            <form onSubmit={handleEditSubmit}>
              {editError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
                  {editError}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditInput}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input
                  type="text"
                  name="region"
                  value={editForm.region}
                  onChange={handleEditInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={editForm.start_date}
                  onChange={handleEditInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  name="end_date"
                  value={editForm.end_date}
                  onChange={handleEditInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleEditImage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editForm.image_url && (
                  <div className="mt-2">
                    <img
                      src={editForm.image_url.startsWith('http') ? editForm.image_url : `${process.env.REACT_APP_API_URL || "https://venturepoint-backend.onrender.com"}/images/${editForm.image_url.replace(/^.*[\\/]/, '')}`}
                      alt="Current"
                      className="h-12 w-12 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {editLoading ? 'Updating...' : 'Update Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-lg">Loading projects...</div>
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-2xl shadow-2xl overflow-x-auto border-2 border-blue-200 w-full mr-4 p-2 md:p-4">
          <table className="min-w-full text-sm md:text-base">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-navy">ID</th>
                <th className="py-3 px-4 text-left font-semibold text-navy">Name</th>
                <th className="py-3 px-4 text-left font-semibold text-navy">Description</th>
                <th className="py-3 px-4 text-left font-semibold text-navy">Region</th>
                <th className="py-3 px-4 text-left font-semibold text-navy">Start Date</th>
                <th className="py-3 px-4 text-left font-semibold text-navy">End Date</th>
                <th className="py-3 px-4 text-left font-semibold text-navy">Image</th>
                <th className="py-3 px-4 text-left font-semibold text-navy">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 px-4 text-center text-gray-500">
                    <div className="text-lg">No projects found</div>
                    <div className="text-sm mt-1">Add your first project to get started!</div>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-blue-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900">{project.id}</td>
                    <td className="py-4 px-4 font-medium text-gray-900">{project.name}</td>
                    <td className="py-4 px-4 max-w-xs break-words" title={project.description}>{project.description}</td>
                    <td className="py-4 px-4 text-gray-700">{project.region}</td>
                    <td className="py-4 px-4 text-gray-700">{project.start_date ? project.start_date.split('T')[0] : ''}</td>
                    <td className="py-4 px-4 text-gray-700">{project.end_date ? project.end_date.split('T')[0] : 'Ongoing'}</td>
                    <td className="py-4 px-4">
                      {project.image_url ? (
                        <img 
                          src={project.image_url} 
                          alt="Project" 
                          className="h-12 w-12 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'inline';
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">No image</span>
                      )}
                      {project.image_url && (
                        <span className="text-gray-400 text-sm" style={{display: 'none'}}>
                          Image not found
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-2 items-stretch justify-center">
                        <button
                          onClick={() => handleEditClick(project)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-blue-700 text-base md:text-sm lg:text-base xl:text-lg"
                          style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
                        >
                          Edit
                        </button>
                        {isSuperAdmin ? (
                          <button
                            onClick={() => handleDeleteProject(project.id, project.name)}
                            disabled={deleteLoading === project.id}
                            className="px-3 py-1 bg-red-600 text-white rounded-xl hover:scale-105 shadow-lg disabled:opacity-50 transition-all duration-300 border border-red-700 text-base md:text-sm lg:text-base xl:text-lg"
                            style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
                          >
                            {deleteLoading === project.id ? 'Deleting...' : 'Delete'}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1 bg-gray-400 text-white rounded-xl cursor-not-allowed text-base md:text-sm lg:text-base xl:text-lg"
                            title="Superadmin role required to delete projects"
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