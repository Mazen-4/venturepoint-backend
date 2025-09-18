import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  axios.get((process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com') + '/api/events')
      .then(res => {
        setEvents(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch events.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-poppins font-bold mb-4">Events & Conferences</h1>
      {loading && <p>Loading events...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {events.map((event, idx) => (
          <motion.div
            key={idx}
            className="bg-white bg-opacity-80 rounded-xl shadow-xl p-6 flex flex-col items-center transition-all duration-300 backdrop-blur-lg border border-gray-200"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            whileHover={{ scale: 1.07, boxShadow: "0 8px 32px 0 rgba(46,203,143,0.18)" }}
            whileTap={{ scale: 0.97 }}
          >
            <h2 className="text-xl font-poppins font-semibold mb-2 text-navy text-center">{event.title}</h2>
            <p className="text-gray-900 font-roboto flex-grow text-center">{event.description}</p>
            <span className="text-xs text-gray-500 mt-2">{event.date}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Events;
