
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

const HeroBanner = () => {
  return (
    <div className="relative bg-gradient-to-br from-medicalBlue-600 via-medicalBlue-700 to-medicalTeal-700 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1584982751601-97dcc096659c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat"
        }} />
      </div>
      
      {/* Medical Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 25% 25%, #ffffff 2px, transparent 2px), radial-gradient(circle at 75% 75%, #ffffff 2px, transparent 2px)",
          backgroundSize: "60px 60px"
        }} />
      </div>
      
      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="fade-in-up">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              Book Your Doctor
              <span className="block text-transparent bg-gradient-to-r from-white to-medicalTeal-200 bg-clip-text">
                Appointment Online
              </span>
            </h1>
          </div>
          
          <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Skip the queue and save time with our modern, easy-to-use 
              online booking system designed for healthcare excellence.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg px-8 py-4 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <Link to="/booking">
                Book an Appointment
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="border-2 border-white bg-white/10 backdrop-blur-sm hover:bg-white text-lg px-8 py-4 transition-all duration-300">
              <Link to="/doctors" className="text-white hover:text-medicalBlue-700">
                View Our Doctors
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-white via-medicalBlue-50 to-medicalTeal-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-6 p-6 medical-card group hover:scale-105 transition-all duration-300">
              <div className="medical-icon-bg group-hover:scale-110 transition-transform">
                <Calendar className="h-8 w-8 text-medicalBlue-600" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-medicalGray-800 mb-2">Easy Booking</h3>
                <p className="text-medicalGray-600 text-lg">Book appointments in minutes with our intuitive platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 p-6 medical-card group hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-full group-hover:scale-110 transition-transform">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-medicalGray-800 mb-2">Save Time</h3>
                <p className="text-medicalGray-600 text-lg">Avoid waiting in long queues with instant booking</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 p-6 medical-card group hover:scale-105 transition-all duration-300">
              <div className="medical-icon-bg group-hover:scale-110 transition-transform">
                <CheckCircle className="h-8 w-8 text-medicalGreen-600" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-medicalGray-800 mb-2">Reliable Service</h3>
                <p className="text-medicalGray-600 text-lg">Track your booking status with real-time updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
