import React from "react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
// import { BrowserRouter } from "react-router-dom";


export default function TeamMemberPage() {
  const { slug } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  fetch((process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com') + '/api/team')
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched team data:", data);
        const found = data.find((m) => {
          const memberSlug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          console.log("Checking member:", m.name, "Slug:", memberSlug, "Target:", slug);
          return memberSlug === slug;
        });
        console.log("Matched member:", found);
        setMember(found);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch team member.");
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="py-16 text-center">Loading...</div>;
  if (error || !member) return <div className="py-16 text-center text-red-500">Team member not found.</div>;

  return (
    <div className="container mx-auto py-16 px-6">
      <div className="flex flex-col items-center">
        <img
          src={member.photo_url || "/images/default-profile.png"}
          alt={member.name}
          className="w-56 h-56 object-cover rounded-full shadow-2xl mb-6 border-4 border-emerald"
        />
        <h1 className="text-4xl font-poppins font-extrabold text-gold mb-2 drop-shadow-lg">{member.name}</h1>
        <h2 className="text-xl font-poppins text-emerald font-semibold mb-4 italic">{member.role}</h2>
        <p className="text-lg text-navy max-w-2xl text-center leading-relaxed mb-6">{member.bio}</p>
        {typeof member.details !== 'undefined' && (
          <div className="w-full max-w-3xl bg-white/80 rounded-2xl shadow-xl border border-emerald/30 p-8 mt-4">
            <h3 className="text-2xl font-bold text-emerald font-poppins mb-3 text-center drop-shadow">Details</h3>
            <p className="text-base text-navy font-roboto leading-relaxed whitespace-pre-line text-center">{member.details || "No additional details available."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
