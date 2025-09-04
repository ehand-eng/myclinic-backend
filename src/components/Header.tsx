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
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-medical-600" />
            <Link to="/admin/dashboard" className="font-bold text-xl text-medical-800">
              MyClinic
            </Link>
          </div>
          
          {isMobile ? (
            <>
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
              
              {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-white pt-16">
                  <div className="container mx-auto px-4 py-8 flex flex-col space-y-6">
                    <Link 
                      to="/" 
                      className="flex items-center space-x-2 text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Calendar className="h-5 w-5 text-medical-600" />
                      <span>Book Appointment</span>
                    </Link>
                    <Link 
                      to="/doctors" 
                      className="flex items-center space-x-2 text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5 text-medical-600" />
                      <span>Our Doctors</span>
                    </Link>
                    <Link 
                      to="/contact" 
                      className="flex items-center space-x-2 text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Phone className="h-5 w-5 text-medical-600" />
                      <span>Contact Us</span>
                    </Link>
                    
                    <div className="pt-4 flex flex-col space-y-4">
                      <Button asChild className="w-full bg-medical-600 hover:bg-medical-700">
                        <Link to="/booking" onClick={() => setMobileMenuOpen(false)}>
                          Book Now
                        </Link>
                      </Button>
                      
                      <Button asChild variant="outline" className="w-full">
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
                  <span className="text-sm text-gray-700">
                    <strong>{user.email}</strong>
                    {user.role && ` (${getRoleDisplayName(user.role)})`}
                  </span>
                  <button
                    onClick={handleProfile}
                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-sm text-red-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                

                <Link
                  to="/login"
                  className="px-3 py-1 rounded bg-medical-600 hover:bg-medical-700 text-white text-sm"
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
