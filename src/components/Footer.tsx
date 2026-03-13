import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-gray-200" style={{ background: '#f1f7fd' }}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Company Info */}
          <div>
            <h3 className="font-poppins font-bold text-2xl text-medilab-heading mb-6">
              MyClinic
            </h3>
            <div className="space-y-3 text-medilab-body text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-medilab-primary mt-0.5 flex-shrink-0" />
                <p>
                  No. 123, Main Street<br />
                  Colombo 03, Sri Lanka
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-medilab-primary flex-shrink-0" />
                <a href="tel:+94771234567" className="hover:text-medilab-primary transition-colors">
                  +94 77 123 4567
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-medilab-primary flex-shrink-0" />
                <a href="mailto:booking@docspot-connect.com" className="hover:text-medilab-primary transition-colors">
                  booking@docspot-connect.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-5 w-5 text-medilab-primary flex-shrink-0" />
                <a href="https://wa.me/94771234567" className="hover:text-medilab-primary transition-colors">
                  WhatsApp Booking
                </a>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center space-x-3 mt-6">
              <a href="#" className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-medilab-body hover:bg-medilab-primary hover:text-white hover:border-medilab-primary transition-all" aria-label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-medilab-body hover:bg-medilab-primary hover:text-white hover:border-medilab-primary transition-all" aria-label="Instagram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-medilab-body hover:bg-medilab-primary hover:text-white hover:border-medilab-primary transition-all" aria-label="LinkedIn">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Useful Links */}
          <div>
            <h4 className="font-poppins font-bold text-lg text-medilab-heading mb-6">
              Useful Links
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-medilab-body text-sm hover:text-medilab-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-medilab-body text-sm hover:text-medilab-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-medilab-body text-sm hover:text-medilab-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Our Services */}
          <div>
            <h4 className="font-poppins font-bold text-lg text-medilab-heading mb-6">
              Our Services
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/booking" className="text-medilab-body text-sm hover:text-medilab-primary transition-colors">
                  Online Booking
                </Link>
              </li>
              <li>
                <span className="text-medilab-body text-sm">
                  Doctor Consultation
                </span>
              </li>
              <li>
                <span className="text-medilab-body text-sm">
                  WhatsApp Booking
                </span>
              </li>
              <li>
                <span className="text-medilab-body text-sm">
                  Online Payments
                </span>
              </li>
              <li>
                <span className="text-medilab-body text-sm">
                  SMS Confirmations
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Booking Information */}
          <div>
            <h4 className="font-poppins font-bold text-lg text-medilab-heading mb-6">
              Booking Info
            </h4>
            <ul className="space-y-3 text-medilab-body text-sm">
              <li className="flex items-start space-x-2">
                <span className="text-medilab-primary font-bold">›</span>
                <span>Book appointments 24/7 from your phone or computer</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-medilab-primary font-bold">›</span>
                <span>Receive instant SMS confirmation</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-medilab-primary font-bold">›</span>
                <span>Pay online or at the dispensary</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-medilab-primary font-bold">›</span>
                <span>Track your appointment status in real-time</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 py-6" style={{ background: '#e6f0fa' }}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-medilab-body text-sm">
            © {new Date().getFullYear()} <strong className="text-medilab-heading">eHand Solutions</strong>. All Rights Reserved.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Empowering healthcare through technology
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
