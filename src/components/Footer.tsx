
import { Mail, Phone, MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-medicalGray-900 via-medicalBlue-900 to-medicalTeal-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Main Content - Centered Layout */}
        <div className="text-center space-y-8">
          {/* Main Title */}
          <h2 className="font-bold text-3xl md:text-4xl text-white">
            MyClinic
          </h2>

          {/* Descriptive Paragraph */}
          <p className="text-medicalGray-300 text-lg md:text-xl leading-relaxed max-w-4xl mx-auto">
            Book your doctor appointments easily through WhatsApp, phone, or email.
            Our platform connects you with qualified healthcare professionals for convenient
            and reliable medical consultations.
          </p>

          {/* Contact Information */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
            {/* WhatsApp */}
            <div className="flex items-center space-x-4 group">
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center hover:bg-green-600/30 transition-colors">
                <MessageCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-medicalGray-300 text-lg">WhatsApp Booking</p>
                <a href="https://wa.me/1234567890" className="text-white hover:text-green-400 transition-colors text-lg font-medium">
                  +1 (234) 567-890
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center space-x-4 group">
              <div className="w-12 h-12 bg-medicalTeal-600/20 rounded-full flex items-center justify-center hover:bg-medicalTeal-600/30 transition-colors">
                <Phone className="h-6 w-6 text-medicalTeal-400" />
              </div>
              <div className="text-left">
                <p className="text-medicalGray-300 text-lg">Phone Booking</p>
                <a href="tel:+1-555-123-4567" className="text-white hover:text-medicalTeal-400 transition-colors text-lg font-medium">
                  +1 (555) 123-4567
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-4 group">
              <div className="w-12 h-12 bg-medicalBlue-600/20 rounded-full flex items-center justify-center hover:bg-medicalBlue-600/30 transition-colors">
                <Mail className="h-6 w-6 text-medicalBlue-400" />
              </div>
              <div className="text-left">
                <p className="text-medicalGray-300 text-lg">Email Booking</p>
                <a href="mailto:booking@docspot-connect.com" className="text-white hover:text-medicalBlue-400 transition-colors text-lg font-medium">
                  booking@docspot-connect.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-t border-medicalGray-500 mt-16 pt-8">
          {/* Copyright Section */}
          <div className="text-center">
            <p className="text-medicalGray-400 text-lg">
              &copy; {new Date().getFullYear()} eHand Solutions. All rights reserved.
            </p>
            <p className="text-medicalGray-500 text-sm mt-2">
              Empowering healthcare through technology
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
