import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Link } from "react-router-dom";

function About() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aboutData, setAboutData] = useState(null);

  useEffect(() => {
    // Fetch team members
  axios.get((process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com') + '/api/team')
      .then(res => {
        setTeam(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch team members.");
        setLoading(false);
      });
    
    // Fetch about data with debugging
    console.log("Fetching about data...");
  axios.get((process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com') + '/api/about')
      .then(res => {
        console.log("About API Response:", res.data);
        console.log("About data keys:", Object.keys(res.data));
        setAboutData(res.data);
      })
      .catch((error) => {
        console.error("About API Error:", error);
        setAboutData(null);
      });
  }, []);

  // Debug: Log aboutData when it changes
  useEffect(() => {
    console.log("aboutData state updated:", aboutData);
  }, [aboutData]);

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
        Meet Our <span className="text-gold">Team</span>
      </h1>

      {loading && <p className="text-center text-lg">Loading team members...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch">
        {team.map((member, idx) => (
          <Link
            key={idx}
            to={`/team/${member.id}`}
            className="w-full"
          >
            <motion.div
              className="relative bg-white/20 backdrop-blur-xl rounded-3xl p-8 flex flex-col items-center text-center shadow-xl border border-white/30 transition-transform duration-500 min-h-[400px] h-full"
              custom={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              whileHover={{
                scale: 1.07,
                rotate: 1,
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.56)"
              }}
            >
              {/* Profile Image */}
              <motion.img
                src={member.photo_url ? ((member.photo_url.startsWith('http') ? member.photo_url : (process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com' || 'https://localhost:3000') + member.photo_url)) : (process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com' || 'https://localhost:3000') + '/images/default-profile.png'}
                alt={member.name}
                className="w-36 h-36 object-cover rounded-full shadow-lg mb-4 border-2 border-emerald transition-transform duration-500"
                whileHover={{ scale: 1.1 }}
                onLoad={() => console.log(`Card image loaded for ${member.name}:`, member.photo_url)}
                onError={(e) => { 
                  console.log(`Card image failed for ${member.name}:`, member.photo_url);
                  e.target.src = (process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com') + '/images/default-profile.png'; 
                }}
              />
              {/* Name */}
              <h2 className="text-2xl font-poppins font-bold text-gold mb-1 drop-shadow-sm">
                {member.name}
              </h2>
              {/* Role */}
              <p className="text-emerald font-medium italic mb-2">
                {member.role}
              </p>
              {/* Bio */}
              <p className="text-blue-900 text-sm leading-relaxed">
                {member.bio}
              </p>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Debug: Show aboutData state
      <div className="w-full max-w-4xl mx-auto mt-16 p-4 bg-red-100 border">
        <h3>DEBUG INFO:</h3>
        <p>aboutData: {aboutData ? "Has data" : "No data"}</p>
        <p>aboutData type: {typeof aboutData}</p>
        {aboutData && <pre>{JSON.stringify(aboutData, null, 2)}</pre>}
      </div> */}

      {/* About Table Data Section */}
      {aboutData ? (
        <div className="w-full max-w-4xl mx-auto mt-16">
          {/* <h2 className="text-4xl font-poppins font-bold text-center mb-8 text-navy">About Our Company</h2> */}
          {Object.entries(aboutData)
            .filter(([key]) => key !== 'id') // Exclude the id field
            .map(([header, value]) => (
              <div key={header} className="mb-10">
                <h3 className="text-3xl font-poppins font-bold text-emerald mb-3 drop-shadow text-center">
                  {header.replace(/_/g, ' ').toUpperCase()}
                </h3>
                <div className="bg-white/80 rounded-2xl shadow-xl border border-emerald/30 p-8 text-lg text-navy font-roboto leading-relaxed text-center whitespace-pre-line">
                  {value}
                </div>
              </div>
            ))
          }
        </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto mt-16 p-4 bg-yellow-100 border text-center">
          <p>No about data available</p>
        </div>
      )}
    </div>
  );
}

export default About;