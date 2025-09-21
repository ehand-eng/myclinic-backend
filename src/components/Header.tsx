import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X, Calendar, User, Phone } from 'lucide-react';
import { useState } from 'react';
import { getRoleDisplayName } from '@/lib/roleUtils';

const Header = () => {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userStr = localStorage.getItem('current_user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    window.location.href = '/login'; // or use navigate('/login') if using react-router
  };

  const handleProfile = () => {
    window.location.href = '/profile'; // or use navigate('/profile')
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-medicalBlue-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="medical-icon-bg">
              <Calendar className="h-6 w-6 text-medicalBlue-600" />
            </div>
            <Link to="/admin/dashboard" className="font-bold text-2xl medical-text-gradient">
              DocSpot Connect
            </Link>
          </div>
          
          {isMobile ? (
            <>
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-medicalBlue-600 hover:bg-medicalBlue-50">
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
              
              {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md pt-16">
                  <div className="container mx-auto px-4 py-8 flex flex-col space-y-6">
                    <Link 
                      to="/" 
                      className="flex items-center space-x-3 text-lg font-medium text-medicalGray-700 hover:text-medicalBlue-600 transition-colors p-3 rounded-lg hover:bg-medicalBlue-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Calendar className="h-5 w-5 text-medicalBlue-600" />
                      <span>Book Appointment</span>
                    </Link>
                    <Link 
                      to="/doctors" 
                      className="flex items-center space-x-3 text-lg font-medium text-medicalGray-700 hover:text-medicalBlue-600 transition-colors p-3 rounded-lg hover:bg-medicalBlue-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5 text-medicalBlue-600" />
                      <span>Our Doctors</span>
                    </Link>
                    <Link 
                      to="/contact" 
                      className="flex items-center space-x-3 text-lg font-medium text-medicalGray-700 hover:text-medicalBlue-600 transition-colors p-3 rounded-lg hover:bg-medicalBlue-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Phone className="h-5 w-5 text-medicalBlue-600" />
                      <span>Contact Us</span>
                    </Link>
                    
                    <div className="pt-4 flex flex-col space-y-4">
                      <Button asChild className="w-full medical-button">
                        <Link to="/booking" onClick={() => setMobileMenuOpen(false)}>
                          Book Now
                        </Link>
                      </Button>
                      
                      <Button asChild variant="outline" className="w-full medical-button-outline">
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                          Admin Login
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <nav className="flex items-center space-x-8">
                 {/* <Link to="/admin/dashboard" className="text-gray-700 hover:text-medical-600 font-medium">
                  Home
                </Link>
                <Link to="/doctors" className="text-gray-700 hover:text-medical-600 font-medium">
                  Our Doctors
                </Link>
                <Link to="/contact" className="text-gray-700 hover:text-medical-600 font-medium">
                  Contact
                </Link>  */}
              </nav>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-medicalGray-800">
                      {user.email}
                    </div>
                    {user.role && (
                      <div className="text-xs text-medicalBlue-600 font-medium">
                        {getRoleDisplayName(user.role)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleProfile}
                    className="px-4 py-2 rounded-lg bg-medicalBlue-50 hover:bg-medicalBlue-100 text-medicalBlue-700 text-sm font-medium transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="medical-button text-sm px-6 py-2"
                >
                  Login
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
