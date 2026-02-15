import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X, Calendar, User, Phone, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { getRoleDisplayName } from '@/lib/roleUtils';
import MyBookingsModal from '@/components/MyBookingsModal';

const Header = () => {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);
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
    <>
      <MyBookingsModal
        isOpen={showMyBookings}
        onClose={() => setShowMyBookings(false)}
      />
      <header className="bg-gradient-to-br from-medicalGray-900 via-medicalBlue-900 to-medicalTeal-900 text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="medical-icon-bg-dark">
                <Calendar className="h-6 w-6 text-medicalBlue-400" />
              </div>
              <Link to="/" className="font-bold text-2xl text-white">
                MyClinic
              </Link>
            </div>

            {isMobile ? (
              <>
                <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-white hover:bg-white/10">
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>

                {mobileMenuOpen && (
                  <div className="fixed inset-0 z-50 bg-gradient-to-br from-medicalGray-900 via-medicalBlue-900 to-medicalTeal-900 text-white pt-16">
                    <div className="container mx-auto px-4 py-8 flex flex-col space-y-6">
                      <Link
                        to="/"
                        className="flex items-center space-x-3 text-lg font-medium text-white hover:text-medicalBlue-400 transition-colors p-3 rounded-lg hover:bg-white/10"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Calendar className="h-5 w-5 text-medicalBlue-400" />
                        <span>Home</span>
                      </Link>
                      <Link
                        to="/about"
                        className="flex items-center space-x-3 text-lg font-medium text-white hover:text-medicalBlue-400 transition-colors p-3 rounded-lg hover:bg-white/10"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5 text-medicalTeal-400" />
                        <span>About Us</span>
                      </Link>
                      <Link
                        to="/contact"
                        className="flex items-center space-x-3 text-lg font-medium text-white hover:text-medicalBlue-400 transition-colors p-3 rounded-lg hover:bg-white/10"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Phone className="h-5 w-5 text-medicalGreen-400" />
                        <span>Contact Us</span>
                      </Link>

                      {/* Show My Bookings for logged-in online users */}
                      {user && (!user.role || user.role === 'online') && (
                        <button
                          onClick={() => {
                            setShowMyBookings(true);
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center space-x-3 text-lg font-medium text-white hover:text-medicalBlue-400 transition-colors p-3 rounded-lg hover:bg-white/10 w-full text-left"
                        >
                          <BookOpen className="h-5 w-5 text-medicalBlue-400" />
                          <span>My Bookings</span>
                        </button>
                      )}

                      <div className="pt-4 flex flex-col space-y-4">
                        <Button asChild className="w-full bg-white text-medicalBlue-700 hover:bg-gray-100">
                          <Link to="/booking" onClick={() => setMobileMenuOpen(false)}>
                            Book Now
                          </Link>
                        </Button>

                        <Button asChild variant="outline" className="w-full border-white text-white hover:bg-white hover:text-medicalBlue-700">
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
                  <Link to="/" className="text-white hover:text-medicalBlue-400 font-medium transition-colors">
                    Home
                  </Link>
                  <Link to="/about" className="text-white hover:text-medicalTeal-400 font-medium transition-colors">
                    About Us
                  </Link>
                  <Link to="/contact" className="text-white hover:text-medicalGreen-400 font-medium transition-colors">
                    Contact Us
                  </Link>
                </nav>
                {user ? (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {user.email}
                      </div>
                      {user.role && (
                        <div className="text-xs text-medicalBlue-400 font-medium">
                          {getRoleDisplayName(user.role)}
                        </div>
                      )}
                    </div>
                    {/* Show My Bookings only for online users */}
                    {(!user.role || user.role === 'online') && (
                      <button
                        onClick={() => setShowMyBookings(true)}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <BookOpen className="h-4 w-4" />
                        My Bookings
                      </button>
                    )}
                    <button
                      onClick={handleProfile}
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                    >
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-sm font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="bg-white text-medicalBlue-700 hover:bg-gray-100 text-sm px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Login
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
