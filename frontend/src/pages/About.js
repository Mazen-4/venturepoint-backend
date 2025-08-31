import { useEffect, useState } from "react";
import axios from "axios";

function About() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/team")
      .then(res => {
        setTeam(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch team members.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-poppins font-bold mb-4">About Us</h1>
      {loading && <p>Loading team members...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {team.map((member, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-poppins font-semibold">{member.name}</h2>
            <p className="text-gray-600">{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default About;
