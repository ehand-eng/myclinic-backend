
import { Link } from 'react-router-dom';
import { Calendar, Mail, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-medicalGray-900 via-medicalBlue-900 to-medicalTeal-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="medical-icon-bg-dark">
                <Calendar className="h-6 w-6 text-medicalBlue-400" />
              </div>
              <span className="font-bold text-2xl text-white">DocSpot Connect</span>
            </div>
            <p className="text-medicalGray-300 text-lg leading-relaxed">
              Streamlining doctor appointments for small dispensaries.
              Skip the queue, book online with our modern platform.
            </p>
            <div className="flex space-x-4">
              <div className="w-12 h-12 bg-medicalBlue-600/20 rounded-lg flex items-center justify-center hover:bg-medicalBlue-600/30 transition-colors cursor-pointer">
                <Calendar className="h-6 w-6 text-medicalBlue-400" />
              </div>
              <div className="w-12 h-12 bg-medicalTeal-600/20 rounded-lg flex items-center justify-center hover:bg-medicalTeal-600/30 transition-colors cursor-pointer">
                <Mail className="h-6 w-6 text-medicalTeal-400" />
              </div>
              <div className="w-12 h-12 bg-medicalGreen-600/20 rounded-lg flex items-center justify-center hover:bg-medicalGreen-600/30 transition-colors cursor-pointer">
                <Phone className="h-6 w-6 text-medicalGreen-400" />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-xl mb-6 text-white">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-medicalGray-300 hover:text-medicalBlue-400 transition-colors text-lg flex items-center group">
                  <div className="w-2 h-2 bg-medicalBlue-400 rounded-full mr-3 group-hover:scale-125 transition-transform"></div>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-medicalGray-300 hover:text-medicalBlue-400 transition-colors text-lg flex items-center group">
                  <div className="w-2 h-2 bg-medicalTeal-400 rounded-full mr-3 group-hover:scale-125 transition-transform"></div>
                  Book an Appointment
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="text-medicalGray-300 hover:text-medicalBlue-400 transition-colors text-lg flex items-center group">
                  <div className="w-2 h-2 bg-medicalGreen-400 rounded-full mr-3 group-hover:scale-125 transition-transform"></div>
                  Our Doctors
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-medicalGray-300 hover:text-medicalBlue-400 transition-colors text-lg flex items-center group">
                  <div className="w-2 h-2 bg-medicalBlue-400 rounded-full mr-3 group-hover:scale-125 transition-transform"></div>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-xl mb-6 text-white">Contact Info</h3>
            <ul className="space-y-6">
              <li className="flex items-center space-x-4 group">
                <div className="medical-icon-bg-dark group-hover:scale-110 transition-transform">
                  <Mail className="h-5 w-5 text-medicalBlue-400" />
                </div>
                <a href="mailto:info@docspot-connect.com" className="text-medicalGray-300 hover:text-medicalBlue-400 transition-colors text-lg">
                  info@docspot-connect.com
                </a>
              </li>
              <li className="flex items-center space-x-4 group">
                <div className="medical-icon-bg-dark group-hover:scale-110 transition-transform">
                  <Phone className="h-5 w-5 text-medicalTeal-400" />
                </div>
                <a href="tel:+1-555-123-4567" className="text-medicalGray-300 hover:text-medicalTeal-400 transition-colors text-lg">
                  +1-555-123-4567
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-medicalGray-700 mt-12 pt-8 text-center">
          <p className="text-medicalGray-400 text-lg">
            &copy; {new Date().getFullYear()} DocSpot Connect. All rights reserved.
          </p>
          <p className="text-medicalGray-500 text-sm mt-2">
            Empowering healthcare through technology
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
