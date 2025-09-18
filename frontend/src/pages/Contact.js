import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    try {
  await axios.post((process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com') + '/api/contact', formData);
      setStatus("Message sent successfully!");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      setStatus("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-full h-full max-w-6xl mx-auto bg-gradient-to-br from-navy via-navy/90 to-emerald/40 rounded-[1rem]" style={{borderRadius: '1rem'}}></div>
      </div>
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-emerald/30 p-6"
        >
          <h1 className="text-4xl text-navy font-poppins font-bold mb-6 text-center">
            Contact Us
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {["name", "email", "subject"].map((field) => (
              <div key={field}>
                <label
                  className="block text-gray-800 font-semibold mb-1"
                  htmlFor={field}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}:
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald transition"
                  type={field === "email" ? "email" : "text"}
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}

            <div>
              <label
                className="block text-gray-800 font-semibold mb-1"
                htmlFor="message"
              >
                Message:
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald transition"
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full bg-emerald text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-navy hover:shadow-emerald/40 transition border-2 border-gold"
            >
              Send Message
            </motion.button>

            {status && (
              <p className="mt-3 text-center text-gray-800 font-medium">
                {status}
              </p>
            )}
          </form>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-emerald/30 p-6 flex flex-col justify-center"
        >
          <h2 className="text-3xl font-extrabold font-poppins text-navy mb-6 tracking-wide drop-shadow-lg text-center">
            Our Contact Details
          </h2>

          <div className="flex flex-col gap-6 text-center">
            <div>
              <span className="font-semibold text-emerald text-lg">Email:</span>
              <a
                href="mailto:info@VenturePoint-Egypt.com"
                className="text-navy underline hover:text-emerald transition block mt-1"
              >
                info@VenturePoint-Egypt.com
              </a>
            </div>
            <div>
              <span className="font-semibold text-emerald text-lg">Address:</span>
              <p className="text-navy text-base mt-1">
                Street 44, El-Nakheel Compound, First settlement, Cairo, Egypt
              </p>
            </div>
            <div>
              <span className="font-semibold text-emerald text-lg">Phone:</span>
              <p className="text-navy text-base mt-1">
                +201003400202 &nbsp; | &nbsp; +1202-390-4405
              </p>
            </div>
              {/* Google Maps Embed */}
              <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg mt-6">
                <span className="font-semibold text-emerald text-lg">Location:</span>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3454.7928348515466!2d31.287651976522167!3d30.014104374938935!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x145838c95e5b91b7%3A0x96f5b164fc296c20!2sStreet%2044%2C%20Al%20Abageyah%2C%20El%20Mokattam%2C%20Cairo%20Governorate!5e0!3m2!1sen!2seg!4v1758036735234!5m2!1sen!2seg"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Company Location Map"
                ></iframe>
              </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Contact;
