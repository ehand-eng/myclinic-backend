
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroBanner from '@/components/HeroBanner';
import { useEffect, useState } from 'react';
import { Doctor, Dispensary } from '@/api/models';
import { DoctorService, DispensaryService } from '@/api/services';
import { Stethoscope, Calendar, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Fetch doctors and all dispensaries
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [allDoctors, allDispensaries] = await Promise.all([
          DoctorService.getAllDoctors(true),
          DispensaryService.getAllDispensaries(),
        ]);
        setDoctors(allDoctors);
        setDispensaries(allDispensaries);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load doctors and dispensaries.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <HeroBanner />
        
        {/* How It Works - Services Section (Medilab Style) */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="medilab-section-title">
              <h2>How It Works</h2>
              <p>Book your appointment in 3 simple steps with our streamlined process</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center p-8 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
                <div className="medilab-icon-box mx-auto mb-6">
                  <Stethoscope className="h-8 w-8 text-medilab-primary" />
                </div>
                <h3 className="font-poppins font-bold text-xl text-medilab-heading mb-3">Select Doctor & Dispensary</h3>
                <p className="text-medilab-body leading-relaxed">
                  Choose from our network of qualified doctors and convenient locations near you.
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="text-center p-8 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
                <div className="medilab-icon-box mx-auto mb-6">
                  <Calendar className="h-8 w-8 text-medilab-primary" />
                </div>
                <h3 className="font-poppins font-bold text-xl text-medilab-heading mb-3">Pick a Date & Time</h3>
                <p className="text-medilab-body leading-relaxed">
                  Browse available slots and select a time that works perfectly for your schedule.
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="text-center p-8 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
                <div className="medilab-icon-box mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-medilab-primary" />
                </div>
                <h3 className="font-poppins font-bold text-xl text-medilab-heading mb-3">Confirm Your Booking</h3>
                <p className="text-medilab-body leading-relaxed">
                  Provide your details and receive instant confirmation with all the appointment details.
                </p>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <a
                href="#appointment"
                className="medilab-btn inline-flex items-center text-base px-10 py-3"
              >
                Book Your Appointment Now
              </a>
            </div>
          </div>
        </section>

        {/* Stats / Numbers Section */}
        <section className="py-16" style={{ background: '#f1f7fd' }}>
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="font-poppins text-4xl font-bold text-medilab-primary mb-2">
                  {isLoading ? '...' : doctors.length}+
                </div>
                <p className="text-medilab-body font-medium">Doctors</p>
              </div>
              <div>
                <div className="font-poppins text-4xl font-bold text-medilab-primary mb-2">
                  {isLoading ? '...' : dispensaries.length}+
                </div>
                <p className="text-medilab-body font-medium">Dispensaries</p>
              </div>
              <div>
                <div className="font-poppins text-4xl font-bold text-medilab-primary mb-2">
                  24/7
                </div>
                <p className="text-medilab-body font-medium">Online Booking</p>
              </div>
              <div>
                <div className="font-poppins text-4xl font-bold text-medilab-primary mb-2">
                  100%
                </div>
                <p className="text-medilab-body font-medium">Satisfaction</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
