function Footer() {
  return (
    <footer
      className="w-full bg-navy/80 backdrop-blur-lg text-white py-6 text-center border-t border-emerald/30 font-inter rounded-t-3xl shadow-2xl"
      style={{ position: 'relative', bottom: 0 }}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-4 items-center justify-center">
        <div className="flex flex-wrap justify-center items-center gap-8 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald">Email:</span>
            <a href="mailto:info@VenturePoint-Egypt.com" className="text-white underline">info@VenturePoint-Egypt.com</a>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald">Address:</span>
            <span className="text-white">Street 44, El-Nakheel Compound, First settlement, Cairo, Egypt</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald">Phone:</span>
            <span className="text-white">+201003400202 | +1202-390-4405</span>
          </div>
        </div>
        <span className="text-gold">&copy; {new Date().getFullYear()} VenturePoint. <span className="text-white ml-1">All rights reserved.</span></span>
      </div>
    </footer>
  );
}

export default Footer;