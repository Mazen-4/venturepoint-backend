
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";
import VantaBackground from "../components/VantaBackground";

function Home() {
  // State for each section
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [articles, setArticles] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Fetch previews for each section
  axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/services`).then(res => setServices(res.data.slice(0, 3)));
  axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/projects`).then(res => setProjects(res.data.slice(0, 3)));
  axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/articles`).then(res => setArticles(res.data.slice(0, 3)));
  axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events`).then(res => setEvents(res.data.slice(0, 3)));
  }, []);

  // Partner logo placeholders
  const partnerLogos = [
    'https://ui-avatars.com/api/?name=Partner+1&background=002147&color=fff&size=128',
    'https://ui-avatars.com/api/?name=Partner+2&background=002147&color=fff&size=128',
    'https://ui-avatars.com/api/?name=Partner+3&background=002147&color=fff&size=128',
    'https://ui-avatars.com/api/?name=Partner+4&background=002147&color=fff&size=128',
  ];

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.6,
        type: 'spring',
        stiffness: 60,
      },
    }),
  };

  return (
    <>
  <VantaBackground />
      <div className="relative bg-gray-50 min-h-screen flex flex-col items-center justify-center pb-16 font-roboto" style={{ zIndex: 1 }}>
      {/* Banner & Intro (static, make dynamic later) */}
      <motion.section 
        className="w-full max-w-4xl mx-auto text-center px-4 mb-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg">
          {/* Banner image can be made dynamic later */}
          <img
            src="/images/banner/banner.jpg"
            alt="VenturePoint Banner"
            className="w-full h-64 object-cover object-center hidden md:block"
            style={{ minHeight: '16rem' }}
            onError={e => (e.target.style.display = 'none')}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy bg-opacity-80">
            <h1 className="text-3xl md:text-5xl font-poppins font-bold text-gold drop-shadow mb-2 tracking-wide">
              VenturePoint for Economic Development
            </h1>
            <h2 className="text-lg md:text-2xl text-white font-poppins font-semibold mb-4">
              نقطة انطلاق للتنمية الاقتصادية
            </h2>
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <Link to="/services" className="bg-navy text-white hover:bg-emerald px-6 py-2 rounded-full shadow transition font-poppins font-semibold">Our Services</Link>
              <Link to="/about" className="bg-emerald text-white hover:bg-navy px-6 py-2 rounded-full shadow transition font-poppins font-semibold">Our Story</Link>
              <Link to="/contact" className="bg-gold text-navy hover:bg-emerald hover:text-white px-6 py-2 rounded-full shadow transition font-poppins font-semibold">Contact Us</Link>
            </div>
          </div>
        </div>
        <p className="mt-8 text-lg text-navy font-roboto font-medium max-w-2xl mx-auto">
          VenturePoint for Economic Development is dedicated to empowering communities and fostering sustainable economic growth through innovative solutions, strategic partnerships, and impactful projects.
        </p>

        {/* Partner Logos Section */}
        <motion.div 
          className="w-full max-w-3xl mx-auto mt-12 px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h3 className="text-xl font-bold text-navy font-poppins mb-6 text-center tracking-wide">Our Partners</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 items-center justify-center">
            {partnerLogos.map((src, idx) => (
              <motion.img
                key={idx}
                src={src}
                alt={`Partner ${idx + 1}`}
                className="h-20 w-20 mx-auto rounded-full shadow-lg bg-white object-cover"
                custom={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              />
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* Services Preview */}
      <motion.section 
        className="w-full max-w-5xl mx-auto mt-8 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <h3 className="text-2xl font-bold text-navy font-poppins mb-4">Our Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={service.id}
              className="bg-white rounded-xl shadow p-6 flex flex-col items-center hover:shadow-lg transition"
              custom={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <img src={service.image || "/images/Logo.png"} alt={service.title} className="h-24 w-24 object-cover rounded-full mb-3 border-4 border-gray-50" onError={e => (e.target.style.display = 'none')} />
              <h4 className="font-poppins font-semibold text-lg text-navy mb-1 text-center">{service.title}</h4>
              <p className="text-sm text-gray-900 font-roboto flex-grow text-center">{service.description}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-right mt-2">
          <Link to="/services" className="text-emerald hover:text-gold font-semibold font-poppins">See all services →</Link>
        </div>
  </motion.section>

      {/* Projects Preview */}
      <motion.section 
        className="w-full max-w-5xl mx-auto mt-16 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <h3 className="text-2xl font-bold text-navy font-poppins mb-4">Projects & Impact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              className="bg-white rounded-xl shadow p-6 flex flex-col items-center hover:shadow-lg transition"
              custom={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <img src={project.image || "/images/Logo.png"} alt={project.title} className="h-24 w-24 object-cover rounded-full mb-3 border-4 border-gray-50" onError={e => (e.target.style.display = 'none')} />
              <h4 className="font-poppins font-semibold text-lg text-navy mb-1 text-center">{project.title}</h4>
              <p className="text-sm text-gray-900 font-roboto flex-grow text-center">{project.description}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-right mt-2">
          <Link to="/projects" className="text-emerald hover:text-gold font-semibold font-poppins">See all projects →</Link>
        </div>
  </motion.section>

  {/* Articles Preview */}
      <motion.section 
        className="w-full max-w-5xl mx-auto mt-16 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
  <h3 className="text-2xl font-bold text-navy font-poppins mb-4">Insights & Articles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {articles.map((post, idx) => (
            <motion.div
              key={post.id}
              className="bg-white rounded-xl shadow p-6 flex flex-col items-center hover:shadow-lg transition"
              custom={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h4 className="font-poppins font-semibold text-lg text-navy mb-1 text-center">{post.title}</h4>
              <p className="text-sm text-gray-900 font-roboto flex-grow text-center">{post.content?.slice(0, 100)}...</p>
              <span className="text-xs text-gray-500 mt-2">{post.date}</span>
            </motion.div>
          ))}
        </div>
        <div className="text-right mt-2">
          <Link to="/articles" className="text-emerald hover:text-gold font-semibold font-poppins">See all articles →</Link>
        </div>
  </motion.section>

      {/* Events Preview */}
      <motion.section 
        className="w-full max-w-5xl mx-auto mt-16 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <h3 className="text-2xl font-bold text-navy font-poppins mb-4">Events & Conferences</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {events.map((event, idx) => (
            <motion.div
              key={event.id}
              className="bg-white rounded-xl shadow p-6 flex flex-col items-center hover:shadow-lg transition"
              custom={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h4 className="font-poppins font-semibold text-lg text-navy mb-1 text-center">{event.title}</h4>
              <p className="text-sm text-gray-900 font-roboto flex-grow text-center">{event.description}</p>
              <span className="text-xs text-gray-500 mt-2">{event.date}</span>
            </motion.div>
          ))}
        </div>
        <div className="text-right mt-2">
          <Link to="/events" className="text-emerald hover:text-gold font-semibold font-poppins">See all events →</Link>
        </div>
  </motion.section>
      </div>
    </>
  );
}

export default Home;
