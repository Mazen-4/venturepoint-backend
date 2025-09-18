import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function TeamMemberPage() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      axios
  .get(`${process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com'}/api/team/${id}`)
        .then((res) => {
          setMember(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to fetch member details");
          setLoading(false);
        });
    }
  }, [id]);

  if (loading)
    return <div className="text-center text-navy py-20 text-2xl">Loading...</div>;
  if (error)
    return <div className="text-center text-red-600 py-20 text-2xl">{error}</div>;
  if (!member)
    return <div className="text-center text-navy py-20 text-2xl">Member not found</div>;

  return (
    <div className="container mx-auto py-20 px-4 md:px-12 flex flex-col items-center">
      <div className="w-full max-w-4xl rounded-3xl shadow-2xl p-10 flex flex-col items-center">
        <img
          src={member.photo_url || "/images/default-profile.png"}
          alt={member.name}
          className="w-64 h-64 object-cover rounded-full shadow-2xl mb-8 border-4 border-emerald"
        />
        <h1 className="text-6xl font-poppins font-extrabold text-gold mb-3 text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
          {member.name}
        </h1>
        <h2 className="text-2xl font-poppins text-emerald font-semibold mb-6 italic text-center">
          {member.role}
        </h2>
        <p className="text-2xl text-navy font-roboto max-w-3xl text-center leading-relaxed mb-8">
          {member.bio}
        </p>
        {member.details && (
          <div className="w-full max-w-3xl rounded-2xl shadow-xl border border-emerald/30 p-8 mt-2">
            <h3 className="text-3xl font-bold text-emerald font-poppins mb-4 text-center drop-shadow">
              Details:
            </h3>
            <p className="text-2xl text-navy font-roboto leading-relaxed whitespace-pre-line text-center">
              {member.details}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
