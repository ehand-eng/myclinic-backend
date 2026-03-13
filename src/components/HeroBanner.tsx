import HeroBookingForm from './HeroBookingForm';
import { Heart, Activity, Stethoscope, Shield, Clock, Users } from 'lucide-react';

const HeroBanner = () => {
  return (
    <div className="hero-banner-section">
      {/* Hero Image Section */}
      <section
        className="relative min-h-[600px] flex items-center"
        style={{
          backgroundImage: 'url(/hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Blue gradient overlay */}
        <div className="absolute inset-0 medilab-hero-overlay" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-3xl mx-auto mb-10">
            <h1 className="font-poppins text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight" style={{ color: '#fff' }}>
              Welcome to MyClinic
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-open-sans leading-relaxed">
              Book your doctor appointments online with ease. Skip the queue and save time with our modern booking platform designed for healthcare excellence.
            </p>
          </div>

          {/* Booking Form embedded in hero */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 md:p-8 shadow-xl max-w-5xl mx-auto">
            <HeroBookingForm />
          </div>
        </div>
      </section>

      {/* Why Choose Us + Feature Cards Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Why Choose Us Box */}
            <div className="lg:col-span-2 bg-medilab-primary rounded-lg p-8 text-white">
              <h2 className="font-poppins text-2xl md:text-3xl font-bold mb-6" style={{ color: '#fff' }}>
                Why Choose MyClinic?
              </h2>
              <p className="text-white/90 leading-relaxed mb-4 font-open-sans">
                We connect patients with qualified healthcare professionals through our seamless online booking platform. With real-time availability, transparent pricing, and multiple convenient dispensary locations across Sri Lanka, your health is in good hands.
              </p>
              <p className="text-white/90 leading-relaxed font-open-sans">
                Our platform supports online payments, SMS confirmations, and a dedicated WhatsApp booking channel — making healthcare access easier than ever before.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="medilab-icon-box mb-4">
                  <Heart className="h-7 w-7 text-medilab-primary" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-medilab-heading mb-2">Quality Healthcare</h3>
                <p className="text-medilab-body text-sm leading-relaxed">
                  Access qualified doctors and specialists across our network of trusted dispensaries.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="medilab-icon-box mb-4">
                  <Clock className="h-7 w-7 text-medilab-primary" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-medilab-heading mb-2">Save Time</h3>
                <p className="text-medilab-body text-sm leading-relaxed">
                  Book appointments instantly and avoid long waiting queues at the dispensary.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="medilab-icon-box mb-4">
                  <Shield className="h-7 w-7 text-medilab-primary" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-medilab-heading mb-2">Secure Payments</h3>
                <p className="text-medilab-body text-sm leading-relaxed">
                  Pay online securely through Dialog Genie or choose to pay at the dispensary.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="medilab-icon-box mb-4">
                  <Users className="h-7 w-7 text-medilab-primary" />
                </div>
                <h3 className="font-poppins font-bold text-lg text-medilab-heading mb-2">Multiple Locations</h3>
                <p className="text-medilab-body text-sm leading-relaxed">
                  Find dispensaries near you across Sri Lanka with GPS-powered location search.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
};

export default HeroBanner;
