import { Link } from "react-router-dom";


function Navbar() {
  return (
    <nav className="bg-navy shadow font-poppins">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gold tracking-wide">VenturePoint</Link>
        <div className="space-x-6">
          <Link to="/" className="text-white hover:text-gold transition-colors font-semibold">Home</Link>
          <Link to="/about" className="text-white hover:text-gold transition-colors font-semibold">About</Link>
          <Link to="/services" className="text-white hover:text-gold transition-colors font-semibold">Services</Link>
          <Link to="/contact" className="text-white hover:text-gold transition-colors font-semibold">Contact</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
