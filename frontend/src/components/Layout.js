import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
  <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-2 py-4 sm:px-4 sm:py-6 md:px-8 lg:px-24 flex justify-center items-center">
        <div
          className="w-full max-w-8xl rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl p-2 sm:p-4 md:p-8 text-sm sm:text-base overflow-x-auto"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}