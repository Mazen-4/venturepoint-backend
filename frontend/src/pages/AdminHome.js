import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, adminAPI, memberAPI, projectAPI, serviceAPI } from '../utils/authUtils';
import AdminAnalyticsChart from '../components/AdminAnalyticsChart';

export default function AdminHome() {
  const [stats, setStats] = useState({ admins: 0, members: 0, projects: 0, services: 0, events: 0, articles: 0 });
  const [user, setUser] = useState({ username: '', role: '' });


  useEffect(() => {
    // Fetch stats in parallel
    Promise.all([
      adminAPI.getAdmins().then(res => res.data.length).catch(() => 0),
      memberAPI.getMembers().then(res => res.data.length).catch(() => 0),
      projectAPI.getProjects().then(res => res.data.length).catch(() => 0),
      serviceAPI.getServices().then(res => res.data.length).catch(() => 0),
      (window.eventAPI ? window.eventAPI.getEvents() : import('../utils/authUtils').then(m => m.eventAPI.getEvents())).then(res => res.data.length).catch(() => 0),
      (window.articleAPI ? window.articleAPI.getArticles() : import('../utils/authUtils').then(m => m.articleAPI.getArticles())).then(res => res.data.length).catch(() => 0)
    ]).then(([admins, members, projects, services, events, articles]) => {
      setStats({ admins, members, projects, services, events, articles });
    });
  }, []);


  const cards = [
    {
      name: 'Admin Management',
      count: stats.admins,
      icon: '👤',
      link: '/admin/admin-management',
      color: 'bg-blue-50',
      accent: 'text-blue-700',
      desc: 'Manage admins and superadmins.'
    },
    {
      name: 'Members Management',
      count: stats.members,
      icon: '🧑‍💼',
      link: '/admin/members',
      color: 'bg-purple-50',
      accent: 'text-purple-700',
      desc: 'Edit founders, advisors, and team.'
    },
    {
      name: 'Services',
      count: stats.services,
      icon: '💼',
      link: '/admin/services',
      color: 'bg-green-50',
      accent: 'text-green-700',
      desc: 'Manage consulting and development services.'
    },
    {
      name: 'Projects',
      count: stats.projects,
      icon: '📁',
      link: '/admin/projects',
      color: 'bg-yellow-50',
      accent: 'text-yellow-700',
      desc: 'Track and update project information.'
    },
    {
      name: 'Events',
      count: stats.events,
      icon: '📅',
      link: '/admin/events',
      color: 'bg-pink-50',
      accent: 'text-pink-700',
      desc: 'Manage company events.'
    },
    {
      name: 'Articles',
      count: stats.articles,
      icon: '📰',
      link: '/admin/articles',
      color: 'bg-indigo-50',
      accent: 'text-indigo-700',
      desc: 'Publish and edit articles.'
    }
  ];

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-1 md:px-4 py-4 landscape:px-8 landscape:py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-navy mb-2 drop-shadow-lg">Admin Dashboard</h1>
        <p className="mt-2 text-gray-400 text-lg">Here you can manage all aspects of VenturePoint.</p>
      </header>
      <section className="mb-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 landscape:p-16 flex flex-col items-center">
         <AdminAnalyticsChart />
        </div>
      </section>
      <section
        className="grid gap-6 w-full"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        {cards.map(card => (
          <Link
            to={card.link}
            key={card.name}
            className={`block ${card.color} rounded-2xl shadow-xl hover:shadow-emerald/40 p-4 sm:p-6 md:p-8 transition-all duration-200 group border-2 border-transparent hover:border-blue-300 landscape:p-8 max-w-xs mx-auto`}
            style={{ wordBreak: 'break-word' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`text-3xl md:text-4xl ${card.accent}`}>{card.icon}</span>
              {card.count !== undefined && <span className="text-xl md:text-2xl font-bold text-gray-700">{card.count}</span>}
            </div>
            <h3 className={`font-bold text-base md:text-lg mb-2 ${card.accent}`}>{card.name}</h3>
            <p className="text-gray-600 mb-2 text-sm md:text-base" style={{wordBreak: 'break-word'}}>{card.desc}</p>
            <span className="text-blue-500 font-medium group-hover:underline">Go to {card.name}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
