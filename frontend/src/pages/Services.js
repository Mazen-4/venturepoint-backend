import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";

// https://venturepoint-backend.onrender.com
// http://localhost:5000

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || "https://venturepoint-backend.onrender.com";
    axios.get(`${API_BASE_URL}/api/services`)
      .then(res => {
      setServices(Array.isArray(res.data) ? res.data : res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch services.");
        setLoading(false);
      });
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" }
    })
  };

  return (
    <div className="container mx-auto py-16 px-6">
      <h1 className="text-5xl font-poppins font-extrabold mb-12 text-center text-navy tracking-wide" style={{textShadow: '0 6px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(46,203,143,0.18)'}}>
        Our <span className="text-gold">Services</span>
      </h1>
      {loading && <p className="text-center text-lg">Loading services...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch">
        {services.map((service, idx) => (
          <motion.div
            key={idx}
            className="relative bg-white/20 backdrop-blur-xl rounded-3xl p-8 flex flex-col items-center text-center shadow-xl border border-white/30 transition-transform duration-500 min-h-[320px] h-full"
            custom={idx}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cardVariants}
            whileHover={{ scale: 1.07, rotate: 1, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.56)" }}
          >
            <h2 className="text-2xl font-poppins font-bold text-emerald mb-2 drop-shadow-sm">{service.title}</h2>
            <p className="text-emerald font-medium italic mb-2">{service.category}</p>
            <p className="text-lg text-navy font-roboto flex-grow text-center leading-relaxed">{service.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Services;
