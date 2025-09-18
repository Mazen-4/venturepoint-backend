import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function TeamMemberPage() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("ID from URL:", id); // Debug: Check what ID we're getting
    
    if (id) {
  axios.get(`${process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com'}/api/team/${id}`)
        .then(res => {
          console.log("API Response:", res.data); // Debug: Check what data we're getting
          setMember(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("API Error:", err); // Debug: Check for errors
          setError("Failed to fetch member details");
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div className="text-center py-16">Loading...</div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!member) return <div className="text-center py-16">Member not found</div>;

  // Debug: Log the member object
  console.log("Member object:", member);
  console.log("Member details:", member.details);
  console.log("Photo URL for", member.name, ":", member.photo_url);

  return (
    <div className="container mx-auto py-16 px-6">
      <div className="flex flex-col items-center">
        <img
          src={member.photo_url || "/images/default-profile.png"}
          alt={member.name}
          className="w-56 h-56 object-cover rounded-full shadow-2xl mb-6 border-4 border-emerald"
          onLoad={() => console.log(`Image loaded successfully for ${member.name}:`, member.photo_url)}
          onError={(e) => {
            console.log(`Image failed to load for ${member.name}:`, member.photo_url);
            e.target.src = '/images/default-profile.png';
          }}
        />
        <h1 className="text-4xl font-poppins font-extrabold text-gold mb-2 drop-shadow-lg">
          {member.name}
        </h1>
        <h2 className="text-xl font-poppins text-emerald font-semibold mb-4 italic">
          {member.role}
        </h2>
        <p className="text-lg text-navy max-w-2xl text-center leading-relaxed mb-8">
          {member.bio}
        </p>
        
        {/* Display the details field */}
        <div className="max-w-4xl">
          <h3 className="text-2xl font-poppins font-bold text-navy mb-4 text-center">
            About {member.name}
          </h3>
          
          {/* Debug: Show if details exist */}
          {member.details ? (
            <div className="text-navy leading-relaxed whitespace-pre-line text-justify">
              {member.details}
            </div>
          ) : (
            <div className="text-red-500 text-center">
              No member data found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}