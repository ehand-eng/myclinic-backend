
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroBanner from '@/components/HeroBanner';
import DoctorCard from '@/components/DoctorCard';
import DispensaryCard from '@/components/DispensaryCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Doctor, Dispensary } from '@/api/models';
import { DoctorService, DispensaryService } from '@/api/services';
import { Stethoscope, Calendar, Clock, CheckCircle, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [nearbyDispensaries, setNearbyDispensaries] = useState<Dispensary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Fetch doctors and all dispensaries
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch featured doctors and dispensaries
        console.log("loading doctors and dispensaries.....");
        const allDoctors = await DoctorService.getAllDoctors();
        const allDispensaries = await DispensaryService.getAllDispensaries();
        
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

  // Get dispensaries near user's location
  const findNearbyDispensaries = () => {
    setIsLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Get dispensaries within 5km radius
          const nearby = await DispensaryService.getDispensariesByLocation(latitude, longitude, 5);
          
          setNearbyDispensaries(nearby);
          
          if (nearby.length === 0) {
            toast({
              title: "No nearby dispensaries",
              description: "We couldn't find any dispensaries within 5km of your location.",
            });
          } else {
            toast({
              title: "Nearby dispensaries found",
              description: `Found ${nearby.length} dispensaries near you.`,
            });
          }
        } catch (error) {
          console.error("Error fetching nearby dispensaries:", error);
          toast({
            title: "Error",
            description: "Failed to find nearby dispensaries.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          title: "Location access denied",
          description: "Please enable location services to find nearby dispensaries.",
          variant: "destructive"
        });
        setIsLoadingLocation(false);
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <HeroBanner />
        
        {/* Location-based Dispensaries */}
        {/* <section className="py-16 bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center space-y-6 fade-in-up">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold medical-text-gradient mb-4">
                  Find Dispensaries Near You
                </h2>
                <p className="text-medicalGray-600 text-lg max-w-2xl">
                  Discover nearby medical facilities and book appointments with qualified healthcare professionals
                </p>
              </div>
              <Button 
                onClick={findNearbyDispensaries} 
                disabled={isLoadingLocation}
                className="medical-button flex items-center space-x-3 px-8 py-4 text-lg"
              >
                <MapPin size={20} />
                <span>{isLoadingLocation ? "Finding nearby locations..." : "Use My Location"}</span>
              </Button>
            </div>
            
            {nearbyDispensaries.length > 0 && (
              <div className="mt-12 fade-in-up">
                <h3 className="text-2xl font-bold text-medicalGray-800 mb-8 text-center">
                  Dispensaries Near You
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {nearbyDispensaries.map((dispensary, index) => (
                    <div key={dispensary.id} className="fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <DispensaryCard 
                        dispensary={dispensary} 
                        doctorCount={dispensary.doctors.length}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section> */}
        
        {/* Featured Doctors */}
        {/* <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our Doctor</h2>
                <p className="text-gray-600">Meet our team of specialists</p>
              </div>
              <Button asChild variant="outline">
                <Link to="/doctors">View All</Link>
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">Loading doctors...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.slice(0, 3).map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            )}
          </div>
        </section> */}
        
        {/* Featured Dispensaries */}
        {/* <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our Dispensaries</h2>
                <p className="text-gray-600">Find a location near you</p>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">Loading dispensaries...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {dispensaries.map((dispensary) => (
                  <DispensaryCard 
                    key={dispensary.id} 
                    dispensary={dispensary} 
                    doctorCount={dispensary.doctors.length}
                  />
                ))}
              </div>
            )}
          </div>
        </section> */}
        
        {/* How It Works */}
        <section className="py-20 bg-gradient-to-br from-medicalGray-50 via-white to-medicalBlue-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 fade-in-up">
              <h2 className="text-4xl md:text-5xl font-bold medical-text-gradient mb-6">How It Works</h2>
              <p className="text-medicalGray-600 text-xl max-w-3xl mx-auto">
                Book your appointment in 3 simple steps with our streamlined process
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              <div className="text-center p-8 bg-gradient-to-b from-medicalBlue-50 to-white rounded-xl shadow-lg border border-medicalBlue-100 group hover:scale-105 transition-all duration-300 fade-in-left">
                <div className="flex justify-center mb-6">
                  <Stethoscope className="h-12 w-12 text-medicalBlue-600 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="bg-medicalBlue-100 text-medicalBlue-800 text-sm font-bold px-4 py-2 rounded-full inline-block mb-4">
                  Step 1
                </div>
                <h3 className="text-2xl font-bold text-medicalGray-800 mb-4">Select Doctor & Dispensary</h3>
                <p className="text-medicalGray-600 text-lg leading-relaxed">
                  Choose from our network of qualified doctors and convenient locations near you.
                </p>
              </div>
              
              <div className="text-center p-8 bg-gradient-to-b from-purple-50 to-white rounded-xl shadow-lg border border-purple-100 group hover:scale-105 transition-all duration-300 fade-in-up">
                <div className="flex justify-center mb-6">
                  <Calendar className="h-12 w-12 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="bg-purple-100 text-purple-800 text-sm font-bold px-4 py-2 rounded-full inline-block mb-4">
                  Step 2
                </div>
                <h3 className="text-2xl font-bold text-medicalGray-800 mb-4">Pick a Date & Time</h3>
                <p className="text-medicalGray-600 text-lg leading-relaxed">
                  Browse available slots and select a time that works perfectly for your schedule.
                </p>
              </div>
              
              <div className="text-center p-8 bg-gradient-to-b from-medicalGreen-50 to-white rounded-xl shadow-lg border border-medicalGreen-100 group hover:scale-105 transition-all duration-300 fade-in-right">
                <div className="flex justify-center mb-6">
                  <CheckCircle className="h-12 w-12 text-medicalGreen-600 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="bg-medicalGreen-100 text-medicalGreen-800 text-sm font-bold px-4 py-2 rounded-full inline-block mb-4">
                  Step 3
                </div>
                <h3 className="text-2xl font-bold text-medicalGray-800 mb-4">Confirm Your Booking</h3>
                <p className="text-medicalGray-600 text-lg leading-relaxed">
                  Provide your details and receive instant confirmation with all the details.
                </p>
              </div>
            </div>
            
            <div className="mt-16 text-center fade-in-up">
              <Button asChild size="lg" className="medical-button text-xl px-12 py-6">
                <Link to="/booking">
                  Book Your Appointment Now
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
