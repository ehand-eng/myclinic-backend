import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, Users, Shield, Heart, Award, Clock } from 'lucide-react';

const AboutUs = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-medicalBlue-600 via-medicalBlue-700 to-medicalTeal-700 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                About
                <span className="block text-transparent bg-gradient-to-r from-white to-medicalTeal-200 bg-clip-text">
                  DocSpot Connect
                </span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Empowering healthcare accessibility through innovative technology solutions 
                designed for modern medical practices.
              </p>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="py-16 bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold medical-text-gradient mb-8">
                Our Mission
              </h2>
              <p className="text-lg text-medicalGray-600 leading-relaxed mb-8">
                To revolutionize healthcare accessibility by providing small dispensaries with 
                cutting-edge appointment booking technology. We believe that quality healthcare 
                should be accessible to everyone, regardless of location or practice size.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="medical-icon-bg mx-auto mb-4">
                      <Heart className="h-8 w-8 text-medicalBlue-600" />
                    </div>
                    <h3 className="font-bold text-xl text-medicalGray-800 mb-3">Patient-First</h3>
                    <p className="text-medicalGray-600">
                      Every feature is designed with patient convenience and care in mind.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="medical-icon-bg mx-auto mb-4">
                      <Shield className="h-8 w-8 text-medicalTeal-600" />
                    </div>
                    <h3 className="font-bold text-xl text-medicalGray-800 mb-3">Secure & Reliable</h3>
                    <p className="text-medicalGray-600">
                      Enterprise-grade security ensures your data and patient information is protected.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="medical-icon-bg mx-auto mb-4">
                      <Award className="h-8 w-8 text-medicalGreen-600" />
                    </div>
                    <h3 className="font-bold text-xl text-medicalGray-800 mb-3">Innovation</h3>
                    <p className="text-medicalGray-600">
                      Continuously evolving technology to meet the changing needs of healthcare.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold medical-text-gradient mb-6">
                    Our Story
                  </h2>
                  <p className="text-lg text-medicalGray-600 leading-relaxed mb-6">
                    Founded in 2023, DocSpot Connect emerged from a simple observation: 
                    small medical dispensaries were struggling with outdated appointment systems 
                    that created barriers between patients and healthcare providers.
                  </p>
                  <p className="text-lg text-medicalGray-600 leading-relaxed mb-8">
                    Our team of healthcare technology experts set out to create a solution that 
                    would level the playing field, giving small practices access to the same 
                    modern booking technology used by large medical centers.
                  </p>
                  <Button asChild className="medical-button text-lg px-8 py-4">
                    <Link to="/booking">
                      Get Started Today
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 text-center">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-medicalBlue-600 mb-2">50+</div>
                      <div className="text-medicalGray-600">Dispensaries</div>
                    </CardContent>
                  </Card>
                  <Card className="p-6 text-center">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-medicalTeal-600 mb-2">1000+</div>
                      <div className="text-medicalGray-600">Patients Served</div>
                    </CardContent>
                  </Card>
                  <Card className="p-6 text-center">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-medicalGreen-600 mb-2">24/7</div>
                      <div className="text-medicalGray-600">Support</div>
                    </CardContent>
                  </Card>
                  <Card className="p-6 text-center">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-medicalBlue-600 mb-2">99.9%</div>
                      <div className="text-medicalGray-600">Uptime</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="py-16 bg-gradient-to-br from-medicalTeal-50 via-white to-medicalBlue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold medical-text-gradient mb-6">
                  Our Values
                </h2>
                <p className="text-lg text-medicalGray-600 max-w-3xl mx-auto">
                  The principles that guide everything we do at DocSpot Connect
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="text-center p-6 hover:scale-105 transition-transform">
                  <CardContent className="pt-6">
                    <div className="medical-icon-bg mx-auto mb-4">
                      <Users className="h-8 w-8 text-medicalBlue-600" />
                    </div>
                    <h3 className="font-bold text-lg text-medicalGray-800 mb-3">Community</h3>
                    <p className="text-medicalGray-600 text-sm">
                      Building stronger healthcare communities through technology.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="text-center p-6 hover:scale-105 transition-transform">
                  <CardContent className="pt-6">
                    <div className="medical-icon-bg mx-auto mb-4">
                      <Clock className="h-8 w-8 text-medicalTeal-600" />
                    </div>
                    <h3 className="font-bold text-lg text-medicalGray-800 mb-3">Efficiency</h3>
                    <p className="text-medicalGray-600 text-sm">
                      Streamlining processes to save time for both patients and providers.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="text-center p-6 hover:scale-105 transition-transform">
                  <CardContent className="pt-6">
                    <div className="medical-icon-bg mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-medicalGreen-600" />
                    </div>
                    <h3 className="font-bold text-lg text-medicalGray-800 mb-3">Accessibility</h3>
                    <p className="text-medicalGray-600 text-sm">
                      Making quality healthcare accessible to everyone, everywhere.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="text-center p-6 hover:scale-105 transition-transform">
                  <CardContent className="pt-6">
                    <div className="medical-icon-bg mx-auto mb-4">
                      <Shield className="h-8 w-8 text-medicalBlue-600" />
                    </div>
                    <h3 className="font-bold text-lg text-medicalGray-800 mb-3">Trust</h3>
                    <p className="text-medicalGray-600 text-sm">
                      Earning and maintaining trust through transparency and reliability.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 bg-gradient-to-br from-medicalBlue-600 via-medicalBlue-700 to-medicalTeal-700 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Transform Your Practice?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Join the growing community of dispensaries using DocSpot Connect 
                to provide better patient experiences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-medicalBlue-700 hover:bg-gray-100 text-lg px-8 py-4">
                  <Link to="/booking">
                    Start Booking Today
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-2 border-white bg-transparent hover:bg-white text-white hover:text-medicalBlue-700 text-lg px-8 py-4">
                  <Link to="/contact">
                    Contact Our Team
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AboutUs;
