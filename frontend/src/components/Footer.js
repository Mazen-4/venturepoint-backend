
function Footer() {
  return (
    <footer className="bg-navy mt-10 font-roboto">
      <div className="container mx-auto px-4 py-6 text-center text-gray-50 text-sm">
        <span className="text-gold">&copy; {new Date().getFullYear()} VenturePoint.</span> All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
