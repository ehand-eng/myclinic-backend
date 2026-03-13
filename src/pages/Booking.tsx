
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BookingForm } from '@/components/booking';
import { useSearchParams } from 'react-router-dom';
import { Clock, Shield, MessageCircle, HelpCircle, CheckCircle, MapPin } from 'lucide-react';

const Booking = () => {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId') || undefined;
  const dispensaryId = searchParams.get('dispensaryId') || undefined;
  const dateStr = searchParams.get('date') || undefined;
  const initialDate = dateStr ? new Date(dateStr) : undefined;

  // Aggressive scroll to top for booking page
  useEffect(() => {
    const forceScrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Multiple attempts to ensure scroll works
    forceScrollToTop();
    setTimeout(forceScrollToTop, 0);
    setTimeout(forceScrollToTop, 10);
    setTimeout(forceScrollToTop, 50);
    setTimeout(forceScrollToTop, 100);
    setTimeout(forceScrollToTop, 200);
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow py-12" style={{ background: '#f1f7fd' }}>
        <div className="container mx-auto px-4">
          <div className="medilab-section-title mb-8">
            <h2>Book Your Appointment</h2>
            <p>Select your preferred doctor, location, date, and appointment time</p>
          </div>
          
          {/* Two-column layout: Form + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Booking Form — takes 2/3 width */}
            <div className="lg:col-span-2">
              <BookingForm
                initialDoctorId={doctorId}
                initialDispensaryId={dispensaryId}
                initialDate={initialDate}
                showCalendar={true}
              />
            </div>

            {/* Right Sidebar — takes 1/3 width */}
            <aside className="space-y-6 lg:sticky lg:top-24">
              {/* How It Works */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-poppins font-bold text-lg text-medilab-heading mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-[#1977cc]" />
                  How It Works
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1977cc] text-white flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-semibold text-medilab-heading text-sm">Select Doctor & Location</p>
                      <p className="text-xs text-medilab-body mt-0.5">Choose your preferred doctor and dispensary</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1977cc] text-white flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-semibold text-medilab-heading text-sm">Pick a Date</p>
                      <p className="text-xs text-medilab-body mt-0.5">Select an available date for your visit</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1977cc] text-white flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-semibold text-medilab-heading text-sm">Enter Your Details</p>
                      <p className="text-xs text-medilab-body mt-0.5">Provide your name, phone & confirm</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1977cc] text-white flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <p className="font-semibold text-medilab-heading text-sm">Receive Confirmation</p>
                      <p className="text-xs text-medilab-body mt-0.5">Get your booking confirmation via SMS</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why Book With Us */}
              <div className="bg-[#1977cc] rounded-xl shadow-sm p-6 text-white">
                <h3 className="font-poppins font-bold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Why Book With Us
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-white/80 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white/90"><span className="font-semibold text-white">Skip the Queue</span> — No more waiting at the clinic</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-white/80 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white/90"><span className="font-semibold text-white">Secure Payments</span> — Pay online or at the clinic</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <MessageCircle className="h-4 w-4 text-white/80 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white/90"><span className="font-semibold text-white">SMS Confirmation</span> — Receive instant booking updates</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-white/80 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white/90"><span className="font-semibold text-white">Multiple Locations</span> — Dispensaries across Sri Lanka</p>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Booking;
