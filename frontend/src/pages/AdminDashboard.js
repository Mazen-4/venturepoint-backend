import React from 'react';
import { Link } from 'react-router-dom';

// Sidebar navigation items
const navItems = [
  { name: 'Dashboard Home', path: '/admin' },
  { name: 'Users', path: '/admin/users' },
  { name: 'Services', path: '/admin/services' },
  { name: 'Projects', path: '/admin/projects' },
  // Add more sections as needed
];

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-8 text-blue-700">Admin Panel</h2>
        <nav className="flex-1">
          <ul className="space-y-4">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className="block px-4 py-2 rounded hover:bg-blue-100 text-gray-700 font-medium"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome to the Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage your company’s data and services here.</p>
        </header>
        <section className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Placeholder cards for CRUD sections */}
            <div className="bg-blue-50 p-4 rounded shadow hover:shadow-lg transition">
              <h3 className="font-bold text-blue-700 mb-2">Users</h3>
              <p className="text-gray-600">View, add, edit, or remove users.</p>
            </div>
            <div className="bg-green-50 p-4 rounded shadow hover:shadow-lg transition">
              <h3 className="font-bold text-green-700 mb-2">Services</h3>
              <p className="text-gray-600">Manage consulting and development services.</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded shadow hover:shadow-lg transition">
              <h3 className="font-bold text-yellow-700 mb-2">Projects</h3>
              <p className="text-gray-600">Track and update project information.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
