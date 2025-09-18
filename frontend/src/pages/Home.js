// Use public URLs for images instead of imports
import React, { useEffect, useState } from "react";
import { FaHandsHelping, FaLightbulb, FaChartLine, FaProjectDiagram, FaRegCalendarAlt, FaRegNewspaper } from "react-icons/fa";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";

// RotatingImages component (top-level, outside Home)
function RotatingImages() {
  const images = [
  `${process.env.REACT_APP_API_URL || "https://venturepoint-backend.onrender.com"}/images/RI1.jpg`,
  `${process.env.REACT_APP_API_URL || "https://venturepoint-backend.onrender.com"}/images/RI2.jpg`,
  `${process.env.REACT_APP_API_URL || "https://venturepoint-backend.onrender.com"}/images/RI3.jpg`,
  ];
  const [index, setIndex] = React.useState(0);
  // For fade-in on mount/refresh
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    setShow(false);
    const fadeTimeout = setTimeout(() => setShow(true), 50); // slight delay for effect
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimeout);
    };
  }, []);

  return (
    <motion.div
      className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl mb-8 sm:mb-10 mx-2 sm:mx-0"
      initial={{ opacity: 0, y: 60 }}
      animate={show ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <AnimatePresence>
        <motion.img
          key={index}
          src={images[index]}
          alt={`Rotating ${index}`}
          className="absolute w-full h-full object-cover rounded-2xl sm:rounded-3xl"
          initial={{ x: 100, opacity: 0, rotate: 5 }}
          animate={{ x: 0, opacity: 1, rotate: 0 }}
          exit={{ x: -100, opacity: 0, rotate: -5 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl sm:rounded-3xl"></div>
    </motion.div>
  );
}

// Partners data
const partners = [
  "Knowledge Corner",
  "The Egyptian National Competitiveness Council (ENCC)",
  "Qora Manal Gamil",
  "Microfinance NGO- Hanaa El Hilaly",
  "CEDARE Khalid Fahmy",
  "Ashraf Gamal",
  "Aboulela International",
];

// Helper to get initials from partner name
function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Home() {
  // State for each section
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [articles, setArticles] = useState([]);
  const [events, setEvents] = useState([]);

  // Loading states for each section
  const [loading, setLoading] = useState({ services: true, projects: true, articles: true, events: true });
  
  useEffect(() => {
    const fetchData = async () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || "https://venturepoint-backend.onrender.com";
      
      try {
        const [servicesRes, projectsRes, articlesRes, eventsRes] = await Promise.allSettled([
          axios.get(`${baseUrl}/api/services`),
          axios.get(`${baseUrl}/api/projects`),
          axios.get(`${baseUrl}/api/articles`),
          axios.get(`${baseUrl}/api/events`)
        ]);

        if (servicesRes.status === 'fulfilled') {
          const arr = Array.isArray(servicesRes.value.data) ? servicesRes.value.data : servicesRes.value.data.data || [];
          setServices(arr.slice(0, 3));
        }
        setLoading(l => ({ ...l, services: false }));

        if (projectsRes.status === 'fulfilled') {
          const arr = Array.isArray(projectsRes.value.data) ? projectsRes.value.data : projectsRes.value.data.data || [];
          setProjects(arr.slice(0, 3));
        }
        setLoading(l => ({ ...l, projects: false }));

        if (articlesRes.status === 'fulfilled') {
          const arr = Array.isArray(articlesRes.value.data) ? articlesRes.value.data : articlesRes.value.data.data || [];
          setArticles(arr.slice(0, 3));
        }
        setLoading(l => ({ ...l, articles: false }));

        if (eventsRes.status === 'fulfilled') {
          const arr = Array.isArray(eventsRes.value.data) ? eventsRes.value.data : eventsRes.value.data.data || [];
          setEvents(arr.slice(0, 3));
        }
        setLoading(l => ({ ...l, events: false }));
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading({ services: false, projects: false, articles: false, events: false });
      }
    };

    fetchData();
  }, []);

  // Simple upward fade-in animation for cards (no spring)
  const cardRise = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.12,
      }
    }
  };

  // Particle config for full page background
  const particlesConfig = {
    particles: {
      number: { value: 30, density: { enable: true, value_area: 800 } }, // Reduced for mobile performance
      color: { value: "#ff8800" },
      shape: { type: "circle" },
      opacity: {
        value: 0.3,
        random: true,
        anim: { enable: true, speed: 0.5, opacity_min: 0.1, sync: false }
      },
      size: {
        value: 3,
        random: true,
        anim: { enable: true, speed: 4, size_min: 0.2, sync: false }
      },
      move: {
        enable: true,
        speed: 1.2,
        direction: "top",
        random: true,
        straight: false,
        out_mode: "out",
        bounce: false
      }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: false },
        onclick: { enable: false },
        resize: true
      }
    },
    retina_detect: true
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent">
      {/* Absolute Particles background for the full page, behind content */}
      <Particles
        id="particles-bg"
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1, pointerEvents: "none" }}
        options={particlesConfig}
        init={async (main) => {
          await loadFull(main);
        }}
      />
      
      {/* Main content above particles */}
      <div className="relative z-10">
        {/* Hero Section */}
        <motion.section
          className="relative w-full min-h-[85vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden rounded-[1.5rem] sm:rounded-[1rem] shadow-xl"
          style={{
            backgroundImage: `url('${process.env.REACT_APP_API_URL || "https://venturepoint-backend.onrender.com"}/images/HeroImage.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Gradient overlay, lighter navy */}
          <div className="absolute inset-0 bg-navy/50"></div>

          <motion.div
            className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-16 sm:py-24 w-full max-w-6xl mx-auto"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          >
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-poppins font-extrabold mb-4 sm:mb-6 tracking-tight leading-tight"
              style={{ 
                color: '#F3F4F6', 
                textShadow: '0 4px 24px rgba(0,0,0,0.85)',
                fontSize: 'clamp(1.875rem, 4vw + 1rem, 3.75rem)'
              }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              VenturePoint{' '}
              <span style={{ color: '#FFD700' }}>for Economic Development</span>
            </motion.h1>
            
            <motion.h2
              className="text-lg sm:text-xl md:text-2xl font-poppins font-medium mb-8 sm:mb-10 max-w-4xl mx-auto leading-relaxed px-2"
              style={{ 
                color: '#E5E7EB', 
                textShadow: '0 2px 16px rgba(0,0,0,0.7)',
                fontSize: 'clamp(1rem, 2vw + 0.5rem, 1.5rem)'
              }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              Empowering communities and fostering sustainable growth through{' '}
              <span style={{ color: '#FFD700', fontWeight: 600 }}>innovation</span>,{' '}
              <span style={{ color: '#FFD700', fontWeight: 600 }}>partnerships</span>, and{' '}
              <span style={{ color: '#FFD700', fontWeight: 600 }}>impactful projects</span>.
            </motion.h2>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-4 w-full max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              {[
                { to: '/services', text: 'Our Services' },
                { to: '/about', text: 'Our Story' },
                { to: '/contact', text: 'Contact Us' }
              ].map((button, index) => (
                <motion.div 
                  key={button.to} 
                  className="w-full sm:w-auto" 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link 
                    to={button.to} 
                    className="w-full sm:w-auto flex items-center justify-center bg-navy text-white hover:bg-gold hover:text-navy px-6 sm:px-8 py-3 sm:py-3.5 rounded-full shadow-lg transition-all duration-300 font-poppins font-semibold border-2 border-gold hover:border-gold text-base sm:text-lg min-w-[160px] touch-manipulation"
                  >
                    {button.text}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Partners Section */}
        <div className="w-full flex flex-col items-center mt-12 sm:mt-16 mb-4 px-4">
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-poppins tracking-wider text-navy mb-4 drop-shadow-lg text-center"
            style={{ 
              letterSpacing: "0.1em",
              fontSize: 'clamp(1.5rem, 3vw + 1rem, 3rem)'
            }}
          >
            Our Partners
          </h2>
        </div>
        
        <section
          className="w-full py-6 sm:py-8 relative overflow-hidden rounded-[1.5rem] sm:rounded-[1rem] shadow-lg mx-0 sm:mx-2"
          style={{ background: "#23272a" }}
        >
          <div className="overflow-x-hidden relative">
            <div
              className="flex gap-6 sm:gap-8 animate-scroll-partners items-center py-2"
              style={{
                width: partners.length * 160 + "px",
                animation: `scroll-partners ${partners.length * 3}s linear infinite`,
              }}
            >
              {partners.concat(partners).map((partner, idx) => (
                <div key={idx} className="flex flex-col items-center min-w-[140px] sm:min-w-[170px] px-2">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gold flex items-center justify-center text-navy text-lg sm:text-2xl font-bold shadow-lg mb-2 border-2 border-emerald">
                    {getInitials(partner)}
                  </div>
                  <span className="text-center text-white font-poppins text-sm sm:text-base font-semibold max-w-[120px] sm:max-w-[140px] truncate mb-1 drop-shadow leading-tight">
                    {partner}
                  </span>
                  <span className="text-xs text-gold font-roboto italic drop-shadow">
                    Partner Organization
                  </span>
                </div>
              ))}
            </div>
          </div>
          <style>{`
            @keyframes scroll-partners {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
        </section>

        {/* Rotating Images Section */}
        <div className="mt-12 sm:mt-16 px-2 sm:px-0">
          <RotatingImages />
        </div>

        {/* Content Sections Container */}
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Services Preview */}
          <motion.section className="w-full mt-12 sm:mt-16">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-navy font-poppins mb-6 text-center sm:text-left">
              Our Services
            </h3>
            {loading.services ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg text-gray-500 animate-pulse">Loading services...</div>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true, amount: 0.2 }} 
                variants={cardRise}
              >
                {services.map((service, idx) => {
                  const icons = [FaHandsHelping, FaLightbulb, FaChartLine];
                  const Icon = icons[idx % icons.length];
                  return (
                    <motion.div
                      key={service.id}
                      className="bg-[#23272a] rounded-xl shadow-xl p-4 sm:p-6 flex flex-col items-center transition-all duration-300 backdrop-blur-lg border border-gray-800 min-h-[200px] sm:min-h-[220px] touch-manipulation"
                      variants={cardRise}
                      whileHover={{ scale: 1.02, boxShadow: "0 8px 32px 0 rgba(0,0,0,0.56)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="mb-3 sm:mb-4 text-3xl sm:text-4xl text-gold drop-shadow-lg">
                        <Icon />
                      </span>
                      <h4 className="font-poppins font-semibold text-base sm:text-lg text-white mb-2 sm:mb-3 text-center leading-tight">
                        {service.title}
                      </h4>
                      <p className="text-sm text-gray-300 font-roboto flex-grow text-center leading-relaxed">
                        {service.description}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
            <div className="text-center sm:text-right mt-4 sm:mt-6">
              <Link
                to="/services"
                className="inline-block text-emerald font-semibold font-poppins underline transition-all duration-300 hover:text-navy hover:bg-gold hover:no-underline hover:rounded-full px-3 sm:px-4 py-2 text-sm sm:text-base touch-manipulation"
              >
                See all services →
              </Link>
            </div>
          </motion.section>

          {/* Projects Preview */}
          <motion.section className="w-full mt-12 sm:mt-16">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-navy font-poppins mb-6 text-center sm:text-left">
              Projects & Impact
            </h3>
            {loading.projects ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg text-gray-500 animate-pulse">Loading projects...</div>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true, amount: 0.2 }} 
                variants={cardRise}
              >
                {projects.map((project, idx) => (
                  <motion.div
                    key={project.id}
                    className="bg-[#23272a] rounded-xl shadow-xl p-4 sm:p-6 flex flex-col items-center transition-all duration-300 backdrop-blur-lg border border-gray-800 min-h-[200px] sm:min-h-[220px] touch-manipulation"
                    variants={cardRise}
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 32px 0 rgba(0,0,0,0.56)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="mb-3 sm:mb-4 text-3xl sm:text-4xl text-gold drop-shadow-lg">
                      <FaProjectDiagram />
                    </span>
                    <h4 className="font-poppins font-semibold text-base sm:text-lg text-white mb-2 sm:mb-3 text-center leading-tight">
                      {project.name}
                    </h4>
                    <p className="text-sm text-gray-300 font-roboto flex-grow text-center leading-relaxed">
                      {project.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}
            <div className="text-center sm:text-right mt-4 sm:mt-6">
              <Link
                to="/projects"
                className="inline-block text-emerald font-semibold font-poppins underline transition-all duration-300 hover:text-navy hover:bg-gold hover:no-underline hover:rounded-full px-3 sm:px-4 py-2 text-sm sm:text-base touch-manipulation"
              >
                See all projects →
              </Link>
            </div>
          </motion.section>

          {/* Articles Preview */}
          <motion.section className="w-full mt-12 sm:mt-16">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-navy font-poppins mb-6 text-center sm:text-left">
              Insights & Articles
            </h3>
            {loading.articles ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg text-gray-500 animate-pulse">Loading articles...</div>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true, amount: 0.2 }} 
                variants={cardRise}
              >
                {articles.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    className="bg-[#23272a] rounded-xl shadow-xl p-4 sm:p-6 flex flex-col items-center transition-all duration-300 backdrop-blur-lg border border-gray-800 min-h-[220px] sm:min-h-[240px] touch-manipulation"
                    variants={cardRise}
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 32px 0 rgba(0,0,0,0.56)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="mb-3 sm:mb-4 text-3xl sm:text-4xl text-gold drop-shadow-lg">
                      <FaRegNewspaper />
                    </span>
                    <h4 className="font-poppins font-semibold text-base sm:text-lg text-white mb-2 sm:mb-3 text-center leading-tight">
                      {post.title}
                    </h4>
                    <p className="text-sm text-gray-300 font-roboto flex-grow text-center leading-relaxed">
                      {post.content?.slice(0, 100)}...
                    </p>
                    <span className="text-xs text-gray-500 mt-2">
                      {post.date}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
            <div className="text-center sm:text-right mt-4 sm:mt-6">
              <Link
                to="/articles"
                className="inline-block text-emerald font-semibold font-poppins underline transition-all duration-300 hover:text-navy hover:bg-gold hover:no-underline hover:rounded-full px-3 sm:px-4 py-2 text-sm sm:text-base touch-manipulation"
              >
                See all articles →
              </Link>
            </div>
          </motion.section>

          {/* Events Preview */}
          <motion.section className="w-full mt-12 sm:mt-16 mb-12 sm:mb-16">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-navy font-poppins mb-6 text-center sm:text-left">
              Events & Conferences
            </h3>
            {loading.events ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg text-gray-500 animate-pulse">Loading events...</div>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true, amount: 0.2 }} 
                variants={cardRise}
              >
                {events.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    className="bg-[#23272a] rounded-xl shadow-xl p-4 sm:p-6 flex flex-col items-center transition-all duration-300 backdrop-blur-lg border border-gray-800 min-h-[220px] sm:min-h-[240px] touch-manipulation"
                    variants={cardRise}
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 32px 0 rgba(0,0,0,0.56)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="mb-3 sm:mb-4 text-3xl sm:text-4xl text-gold drop-shadow-lg">
                      <FaRegCalendarAlt />
                    </span>
                    <h4 className="font-poppins font-semibold text-base sm:text-lg text-white mb-2 sm:mb-3 text-center leading-tight">
                      {event.title}
                    </h4>
                    <p className="text-sm text-gray-300 font-roboto flex-grow text-center leading-relaxed">
                      {event.description}
                    </p>
                    <span className="text-xs text-gray-500 mt-2">
                      {event.date}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
            <div className="text-center sm:text-right mt-4 sm:mt-6">
              <Link 
                to="/events" 
                className="inline-block text-emerald font-semibold font-poppins underline transition-all duration-300 hover:text-navy hover:bg-gold hover:no-underline hover:rounded-full px-3 sm:px-4 py-2 text-sm sm:text-base touch-manipulation"
              >
                See all events →
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

export default Home;