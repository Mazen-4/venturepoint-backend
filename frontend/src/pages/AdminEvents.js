import React, { useEffect, useState, useCallback } from 'react';
import { authAPI, eventAPI } from '../utils/authUtils';
import { useNavigate } from 'react-router-dom';

export default function AdminEvents() {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isSuperAdmin, setIsSuperAdmin] = useState(false);

	// Check user role and fetch events on mount
	useEffect(() => {
		try {
			setIsSuperAdmin(authAPI.hasRole('superadmin'));
		} catch {
			setIsSuperAdmin(false);
		}
		fetchEvents();
	}, []);

	const fetchEvents = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await eventAPI.getEvents();
			console.log('Fetched events:', response.data); // Debug log
			setEvents(response.data);
		} catch (err) {
			setError(err.message || 'Failed to fetch events');
			setEvents([]);
		} finally {
			setLoading(false);
		}
	}, []);

	// Add Event Modal States
	const [showAddModal, setShowAddModal] = useState(false);
	const [addForm, setAddForm] = useState({
		title: '',
		description: '',
		event_date: '',
	});

	// Edit Event Modal States
	const [showEditModal, setShowEditModal] = useState(false);
	const [editForm, setEditForm] = useState({
		id: '',
		title: '',
		description: '',
		event_date: '',
	});
	const [editError, setEditError] = useState(null);
	const [editLoading, setEditLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(null);

	const navigate = useNavigate();

	// Image states
	const [addImage, setAddImage] = useState(null);
	const [editImage, setEditImage] = useState(null);

	// Dedicated image handlers (like AdminProjects)
	const handleAddImage = (e) => {
		setAddImage(e.target.files[0]);
	};
	const handleEditImage = (e) => {
		setEditImage(e.target.files[0]);
	};
	const [addError, setAddError] = useState(null);
	const [addLoading, setAddLoading] = useState(false);

	// Handle logout
	const handleLogout = () => {
		// Add your logout logic here
		navigate('/login');
	};

	// Handle edit button click
	const handleEditClick = (event) => {
		setEditForm({
			id: event.id,
			title: event.title,
			description: event.description,
			event_date: event.event_date,
		});
		setEditImage(null); // Reset image selection
		setShowEditModal(true);
		setEditError(null);
	};

	// Handle edit form input
	const handleEditInput = (e) => {
		setEditForm({ ...editForm, [e.target.name]: e.target.value });
	};

	// Handle add form input
	const handleAddInput = (e) => {
		setAddForm({ ...addForm, [e.target.name]: e.target.value });
	};

	// Validate image file
	const validateImage = (file) => {
		if (!file) return null;
		
		// Check file size (100MB limit)
		if (file.size > 100 * 1024 * 1024) {
			return 'Image is too big. Please upload an image less than 100 MB.';
		}
		
		// Check file type
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return 'Invalid file type. Please upload a valid image (JPEG, PNG, GIF, or WebP).';
		}
		
		return null;
	};

	// Handle add form submit
	const handleAddSubmit = async (e) => {
		e.preventDefault();
		setAddLoading(true);
		setAddError(null);
		
		try {
			// Validate image if provided
			if (addImage) {
				const imageError = validateImage(addImage);
				if (imageError) {
					setAddError(imageError);
					setAddLoading(false);
					return;
				}
			}

			const formData = new FormData();
			formData.append('title', addForm.title.trim());
			formData.append('description', addForm.description.trim());
			formData.append('event_date', addForm.event_date);
			
			if (addImage) {
				formData.append('image', addImage);
			}

			// Debug: Log FormData contents
			console.log('Submitting FormData:');
			for (let [key, value] of formData.entries()) {
				console.log(key, value);
			}

			const result = await eventAPI.createEvent(formData, true); // true = multipart
			console.log('Create result:', result);
			
			// Reset form and close modal
			setShowAddModal(false);
			setAddForm({ title: '', description: '', event_date: '' });
			setAddImage(null);
			await fetchEvents(); // Add await to ensure refresh completes
		} catch (err) {
			console.error('Add event error:', err);
			setAddError(err.response?.data?.message || err.message || 'Failed to add event');
		} finally {
			setAddLoading(false);
		}
	};

	// Handle edit form submit
	const handleEditSubmit = async (e) => {
		e.preventDefault();
		setEditLoading(true);
		setEditError(null);
		
		try {
			// Validate image if provided
			if (editImage) {
				const imageError = validateImage(editImage);
				if (imageError) {
					setEditError(imageError);
					setEditLoading(false);
					return;
				}
			}

			const formData = new FormData();
			formData.append('title', editForm.title.trim());
			formData.append('description', editForm.description.trim());
			formData.append('event_date', editForm.event_date);
			
			if (editImage) {
				formData.append('image', editImage);
			}

			// Debug: Log FormData contents
			console.log('Updating FormData:');
			for (let [key, value] of formData.entries()) {
				console.log(key, value);
			}

			const result = await eventAPI.updateEvent(editForm.id, formData, true); // true = multipart
			console.log('Update result:', result);
			
			setShowEditModal(false);
			setEditImage(null);
			// Immediately refresh events after edit
			await fetchEvents();
		} catch (error) {
			console.error('Edit event error:', error);
			setEditError(error.response?.data?.message || error.message || 'Failed to update event');
		} finally {
			setEditLoading(false);
		}
	};

	// Handle delete event
	const handleDeleteEvent = async (eventId, eventTitle) => {
		if (!window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
			return;
		}
		setDeleteLoading(eventId);
		try {
			await eventAPI.deleteEvent(eventId);
			fetchEvents();
		} catch (error) {
			console.error('Error deleting event:', error);
			setError('Failed to delete event');
		} finally {
			setDeleteLoading(null);
		}
	};

	// Helper function to get image URL
	const getImageUrl = (imageUrl) => {
		if (!imageUrl) return null;
		
		// Debug log
		console.log('Processing image URL:', imageUrl);
		
		// If it's already a full URL, return as is, but add cache-busting
		if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
			return imageUrl + '?t=' + Date.now();
		}
		
		// If it starts with a slash, remove it to avoid double slashes
		const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
		
		// Construct full URL - using images path as per your backend fix
	const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com';
		return `${baseUrl}/${cleanPath}?t=${Date.now()}`;
	};

	// Add Event Modal
	const renderAddModal = showAddModal && (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
			<div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
				<h3 className="text-xl font-bold mb-4">Add New Event</h3>
				<form onSubmit={handleAddSubmit}>
					<div className="mb-4">
						<label className="block mb-2 font-medium text-gray-700">Title *</label>
						<input
							type="text"
							name="title"
							value={addForm.title}
							onChange={handleAddInput}
							className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
							maxLength={255}
						/>
					</div>
					<div className="mb-4">
						<label className="block mb-2 font-medium text-gray-700">Description *</label>
						<textarea
							name="description"
							value={addForm.description}
							onChange={handleAddInput}
							className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							rows="3"
							required
							maxLength={1000}
						/>
					</div>
					<div className="mb-4">
						<label className="block mb-2 font-medium text-gray-700">Event Date *</label>
						<input
							type="date"
							name="event_date"
							value={addForm.event_date}
							onChange={handleAddInput}
							className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>
					<div className="mb-4">
						<label className="block mb-2 font-medium text-gray-700">Image</label>
						<input
							type="file"
							name="image"
							accept="image/*"
							onChange={handleAddImage}
							className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{addImage && (
							<div className="mt-2 text-sm text-gray-600">
								Selected: {addImage.name} ({(addImage.size / 1024 / 1024).toFixed(2)} MB)
							</div>
						)}
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
								setAddImage(null);
								setAddForm({ title: '', description: '', event_date: '' });
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
							{addLoading ? 'Adding...' : 'Add Event'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);

	return (
		<div className="p-2 sm:p-4 md:p-8 w-full max-w-screen-2xl mx-auto">
			<div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
				<h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Events</h2>
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

			{error && (
				<div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
					{error}
				</div>
			)}

			<button
				className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-blue-700 font-medium"
				onClick={() => setShowAddModal(true)}
			>
				+ Add New Event
			</button>

			{/* Edit Modal */}
			{showEditModal && (
				<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
					<div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
						<h3 className="text-xl font-bold mb-4">Edit Event</h3>
						<form onSubmit={handleEditSubmit}>
							<div className="mb-4">
								<label className="block mb-2 font-medium text-gray-700">Title *</label>
								<input
									type="text"
									name="title"
									value={editForm.title}
									onChange={handleEditInput}
									className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
									maxLength={255}
								/>
							</div>
							<div className="mb-4">
								<label className="block mb-2 font-medium text-gray-700">Description *</label>
								<textarea
									name="description"
									value={editForm.description}
									onChange={handleEditInput}
									className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									rows="3"
									required
									maxLength={1000}
								/>
							</div>
							<div className="mb-4">
								<label className="block mb-2 font-medium text-gray-700">Event Date *</label>
								<input
									type="date"
									name="event_date"
									value={editForm.event_date ? editForm.event_date.slice(0, 10) : ''}
									onChange={handleEditInput}
									className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								/>
							</div>
							<div className="mb-4">
								<label className="block mb-2 font-medium text-gray-700">Image</label>
								<input
									type="file"
									name="image"
									accept="image/*"
									onChange={handleEditImage}
									className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								{editImage && (
									<div className="mt-2 text-sm text-gray-600">
										Selected: {editImage.name} ({(editImage.size / 1024 / 1024).toFixed(2)} MB)
									</div>
								)}
								<div className="mt-1 text-xs text-gray-500">
									Leave empty to keep current image
								</div>
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
										setEditImage(null);
									}}
									disabled={editLoading}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
									disabled={editLoading}
								>
									{editLoading ? 'Updating...' : 'Update Event'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Loading State */}
			{loading && (
				<div className="flex items-center justify-center py-12">
					<div className="text-gray-500 text-lg">Loading events...</div>
				</div>
			)}

			{/* Events Table */}
			{!loading && (
				<div className="bg-white rounded-2xl shadow-2xl overflow-x-auto border-2 border-blue-200 w-full">
					<table className="min-w-full text-sm md:text-base">
						<thead className="bg-gray-50">
							<tr>
								<th className="py-3 px-4 text-left font-medium text-gray-700">ID</th>
								<th className="py-3 px-4 text-left font-medium text-gray-700">Title</th>
								<th className="py-3 px-4 text-left font-medium text-gray-700">Description</th>
								<th className="py-3 px-4 text-left font-medium text-gray-700">Event Date</th>
								<th className="py-3 px-4 text-left font-medium text-gray-700">Image</th>
								<th className="py-3 px-4 text-left font-medium text-gray-700">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-blue-100">
							{events.length === 0 ? (
								<tr>
									<td colSpan="6" className="py-8 px-4 text-center text-gray-500">
										<div className="text-lg">No events found</div>
										<div className="text-sm mt-1">Add your first event to get started!</div>
									</td>
								</tr>
							) : (
								events.map((event) => (
									<tr key={event.id} className="hover:bg-blue-50 transition-colors">
										<td className="py-4 px-4 font-medium text-gray-900">{event.id}</td>
										<td className="py-4 px-4 font-medium text-gray-900">{event.title}</td>
										<td className="py-4 px-4 max-w-xs truncate whitespace-pre-line break-words" title={event.description}>{event.description}</td>
										<td className="py-4 px-4 font-medium text-gray-900">{event.event_date ? event.event_date.slice(0, 10) : ''}</td>
										<td className="py-4 px-4">
											{event.image_url ? (
												<div>
													<img
														src={getImageUrl(event.image_url)}
														alt={event.title}
														className="h-12 w-12 object-cover rounded border"
														onLoad={() => console.log('Image loaded successfully:', event.image_url)}
														onError={(e) => {
															console.error('Image failed to load:', {
																originalUrl: event.image_url,
																constructedUrl: getImageUrl(event.image_url),
																eventId: event.id
															});
															e.target.style.display = 'none';
															e.target.nextSibling.style.display = 'inline';
														}}
													/>
													<span className="text-red-400 text-xs hidden">Image not found</span>
												</div>
											) : (
												<span className="text-gray-400">No image</span>
											)}
										</td>
										<td className="py-4 px-4">
											<div className="flex flex-col gap-2 items-stretch justify-center">
												<button
													onClick={() => handleEditClick(event)}
													className="px-3 py-1 bg-blue-600 text-white rounded-xl hover:scale-105 shadow-lg transition-all duration-300 border border-blue-700 text-base md:text-sm lg:text-base xl:text-lg"
													style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
												>
													Edit
												</button>
												{isSuperAdmin ? (
													<button
														onClick={() => handleDeleteEvent(event.id, event.title)}
														disabled={deleteLoading === event.id}
														className="px-3 py-1 bg-red-600 text-white rounded-xl hover:scale-105 shadow-lg disabled:opacity-50 transition-all duration-300 border border-red-700 text-base md:text-sm lg:text-base xl:text-lg"
														style={{fontSize: 'clamp(0.95rem, 1vw + 0.8rem, 1.1rem)'}}
													>
														{deleteLoading === event.id ? 'Deleting...' : 'Delete'}
													</button>
												) : (
													<button
														disabled
														className="px-3 py-1 bg-gray-400 text-white rounded-xl cursor-not-allowed text-base md:text-sm lg:text-base xl:text-lg"
														title="Superadmin role required to delete events"
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
			{renderAddModal}
		</div>
	);
}